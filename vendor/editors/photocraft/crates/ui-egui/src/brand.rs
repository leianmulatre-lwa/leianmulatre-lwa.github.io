//! BIG LWA's original native lightR mark for the PhotoCraft-derived editor.
//!
//! This is drawn by egui INSIDE the WebAssembly canvas, not by an HTML overlay.
//! The original PhotoCraft authorship and licensing remain in Credits/NOTICE.
//! No upstream trademarked image files are bundled here.

use egui::{Align2, Color32, Context, CornerRadius, FontId, Id, Rect, Stroke, StrokeKind, Ui, pos2};

fn rect_id() -> Id {
    Id::new("biglwa-lightr-brand-mark-rect")
}

/// A small textile/block monogram matching the lightR Workshop tile.
/// Painted natively so there is no dependency on removed upstream icon assets.
pub fn paint_mark(ui: &Ui, r: Rect) {
    let p = ui.painter();
    let gold = Color32::from_rgb(184, 120, 23);
    let ink = Color32::from_rgb(49, 33, 27);
    let linen = Color32::from_rgb(252, 231, 198);

    p.rect_filled(r, CornerRadius::same(4), gold);
    p.rect_stroke(r, CornerRadius::same(4), Stroke::new(1.1, ink), StrokeKind::Inside);
    let face = r.shrink(2.2);
    p.rect_filled(face, CornerRadius::same(2), linen);
    p.rect_stroke(face, CornerRadius::same(2), Stroke::new(0.75, ink), StrokeKind::Inside);
    p.text(
        face.center(),
        Align2::CENTER_CENTER,
        "L",
        FontId::proportional((r.width() * 0.65).clamp(9.0, 17.0)),
        ink,
    );
    // Red / yellow / green BIG LWA window-lights, visible inside the native mark.
    let diameter = (r.width() / 9.0).clamp(1.3, 2.6);
    for (i, color) in [
        Color32::from_rgb(223, 96, 91),
        Color32::from_rgb(244, 199, 73),
        Color32::from_rgb(87, 172, 112),
    ]
    .into_iter()
    .enumerate()
    {
        let x = face.min.x + 2.5 + i as f32 * (diameter + 1.1);
        p.circle_filled(pos2(x, face.max.y - 2.3), diameter * 0.46, color);
    }
    ui.ctx().data_mut(|d| d.insert_temp(rect_id(), r));
}

/// Record the native mark's position for layout/regression checks.
#[cfg(test)]
pub fn mark_rect(ctx: &Context) -> Option<Rect> {
    ctx.data(|d| d.get_temp(rect_id()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn light_r_mark_is_painted_natively_and_has_a_testable_rect() {
        let ctx = Context::default();
        crate::PhotocraftApp::setup_context(&ctx, crate::theme::ThemeKind::ALL[0]);
        let mut app = crate::PhotocraftApp::new(photocraft_engine::Session::new(), crate::Services::default());
        app.custom_titlebar = true;
        let out = ctx.run_ui(egui::RawInput::default(), |ui| crate::panels::title_bar(&mut app, ui));
        assert!(mark_rect(&ctx).is_some());
        assert!(!out.shapes.is_empty(), "the native mark should paint without an icon texture");
    }
}
