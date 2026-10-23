//! BIG LWA paintR native mark. Rust draws original stitched-block-inspired pixels
//! directly into the app-bar texture; no upstream trademarked icon is imported.

use egui::{Color32, Context, Id, Rect, TextureHandle, TextureOptions, Ui, pos2};

/// Original BIG LWA paintR artwork is generated in Rust: no upstream icon asset.
fn decode() -> egui::ColorImage {
    let mut image = egui::ColorImage::filled([128, 128], Color32::TRANSPARENT);
    for y in 0_i32..128 {
        for x in 0_i32..128 {
            // Rounded corners, a blue upholstered border and cream fabric center.
            let dx = (12 - x).max(0).max(x - 115);
            let dy = (12 - y).max(0).max(y - 115);
            if dx * dx + dy * dy > 12 * 12 {
                continue;
            }
            let outer = x < 9 || y < 9 || x > 118 || y > 118;
            let inner = x >= 20 && x <= 107 && y >= 20 && y <= 107;
            let mut pixel = if outer {
                Color32::from_rgb(30, 55, 97)
            } else if inner {
                Color32::from_rgb(250, 230, 195)
            } else {
                Color32::from_rgb(21, 104, 195)
            };
            // Native pixel-work P monogram.
            let stem = (43..=55).contains(&x) && (34..=94).contains(&y);
            let cap = (43..=82).contains(&x) && (34..=44).contains(&y);
            let bar = (43..=81).contains(&x) && (60..=70).contains(&y);
            let bowl = (73..=84).contains(&x) && (38..=66).contains(&y);
            if stem || cap || bar || bowl {
                pixel = Color32::from_rgb(23, 45, 88);
            }
            for (i, dot) in [
                Color32::from_rgb(223, 96, 91),
                Color32::from_rgb(244, 199, 73),
                Color32::from_rgb(87, 172, 112),
            ].into_iter().enumerate() {
                let cx = 44 + i as i32 * 20;
                if (x - cx).pow(2) + (y - 99).pow(2) <= 16 {
                    pixel = dot;
                }
            }
            image.pixels[(y * 128 + x) as usize] = pixel;
        }
    }
    image
}

/// The icon texture, uploaded on first use and kept in the context.
fn texture(ctx: &Context) -> TextureHandle {
    let id = Id::new("vectorcraft-brand-mark");
    if let Some(tex) = ctx.data(|d| d.get_temp::<TextureHandle>(id)) {
        return tex;
    }
    let options = TextureOptions { mipmap_mode: Some(egui::TextureFilter::Linear), ..TextureOptions::LINEAR };
    let tex = ctx.load_texture("vectorcraft-brand-mark", decode(), options);
    ctx.data_mut(|d| d.insert_temp(id, tex.clone()));
    tex
}

/// Paint the mark into `r` (square).
pub fn paint_mark(ui: &Ui, r: Rect) {
    let uv = Rect::from_min_max(pos2(0.0, 0.0), pos2(1.0, 1.0));
    ui.painter().image(texture(ui.ctx()).id(), r, uv, Color32::WHITE);
}

/// The mark's texture id (tests: find the painted marks among the shapes).
#[cfg(test)]
pub fn texture_id(ctx: &Context) -> egui::TextureId {
    texture(ctx).id()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::VectorcraftApp;

    #[test]
    fn the_icon_decodes_to_a_rounded_128_px_tile() {
        let img = decode();
        assert_eq!(img.size, [128, 128]);
        // Rounded corners: the corner pixel is transparent, the centre opaque.
        assert_eq!(img.pixels[0].a(), 0);
        assert_eq!(img.pixels[64 * 128 + 64].a(), 255);
    }

    #[test]
    fn the_app_bar_paints_the_icon_from_one_cached_texture() {
        let ctx = Context::default();
        crate::theme::install_fonts(&ctx);
        let mut app = VectorcraftApp::new(vectorcraft_engine::Session::new(), Default::default());
        // The system title bar hides the in-app mark (the OS draws its own icon), so paint the
        // app-drawn bar here.
        app.custom_titlebar = true;
        let mut frame = || {
            let mut out = ctx.run_ui(egui::RawInput::default(), |ui| crate::chrome::app_bar(&mut app, ui));
            let uploads = out.textures_delta.set.values().flat_map(|d| d.iter()).filter(|d| d.image.size() == [128, 128]).count();
            out.textures_delta.clear();
            let marks: Vec<Rect> = out
                .shapes
                .iter()
                .filter_map(|c| match &c.shape {
                    egui::Shape::Mesh(m) if m.texture_id == texture(&ctx).id() => Some(m.calc_bounds()),
                    _ => None,
                })
                .collect();
            (uploads, marks)
        };
        let (uploads, marks) = frame();
        assert_eq!(uploads, 1);
        assert_eq!(marks.len(), 1);
        assert_eq!(marks[0].size(), egui::vec2(18.0, 18.0));
        // Later frames reuse the texture.
        let (uploads, marks) = frame();
        assert_eq!((uploads, marks.len()), (0, 1));
    }
}
