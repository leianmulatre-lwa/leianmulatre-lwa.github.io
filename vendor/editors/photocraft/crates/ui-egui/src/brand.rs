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
    // Native lightR corner artwork matches the three-dimensional fabric block
    // on the BIG LWA Studio card, not the upstream PhotoCraft logo.
    let p = ui.painter();
    let ink = Color32::from_rgb(43, 29, 25);
    let gold = Color32::from_rgb(184, 120, 23);
    let light = Color32::from_rgb(233, 173, 57);
    let dark = Color32::from_rgb(112, 66, 14);
    let linen = Color32::from_rgb(247, 216, 166);
    let x = r.left();
    let y = r.top();
    let w = r.width();
    let h = r.height();
    let pt = |a: f32, b: f32| pos2(x + w * a, y + h * b);
    let stitch = Color32::from_rgb(255, 233, 191);

    // The top, recessed side, and piped front are independent facets.
    p.add(egui::Shape::convex_polygon(
        vec![pt(.08,.24), pt(.3,.03), pt(.95,.09), pt(.75,.31)],
        light,
        Stroke::new(.75, ink),
    ));
    p.add(egui::Shape::convex_polygon(
        vec![pt(.75,.31), pt(.95,.09), pt(.96,.81), pt(.75,.98)],
        dark,
        Stroke::new(.75, ink),
    ));
    let front = Rect::from_min_max(pt(.055,.26), pt(.77,.98));
    p.rect_filled(front, CornerRadius::same(3), gold);
    p.rect_stroke(front, CornerRadius::same(3), Stroke::new(.95, ink), StrokeKind::Inside);
    let binding = front.shrink(1.35);
    p.rect_stroke(binding, CornerRadius::same(2), Stroke::new(.7, stitch), StrokeKind::Inside);
    let cloth = Rect::from_min_max(pt(.16,.37), pt(.68,.87));
    p.rect_filled(cloth, CornerRadius::same(1), linen);
    p.rect_stroke(cloth, CornerRadius::same(1), Stroke::new(.6, ink), StrokeKind::Inside);
    let cloth_stitch = cloth.shrink(1.0);
    p.rect_stroke(cloth_stitch, CornerRadius::same(1), Stroke::new(.4, stitch), StrokeKind::Inside);
    p.text(
        cloth.center(),
        Align2::CENTER_CENTER,
        "L",
        FontId::proportional((w * .43).clamp(7.0, 15.0)),
        ink,
    );
    let diameter = (w / 11.0).clamp(.65, 1.9);
    for (index, color) in [
        Color32::from_rgb(223, 96, 91),
        Color32::from_rgb(244, 199, 73),
        Color32::from_rgb(87, 172, 112),
    ].into_iter().enumerate() {
        let px = x + w * (.23 + index as f32 * .17);
        p.circle_filled(pos2(px, y + h * .935), diameter * .45, color);
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
