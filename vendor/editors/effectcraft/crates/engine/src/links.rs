//! Community and project links (shown in Help ▸, the About dialog, the start screen and the
//! header's Discord button).

pub const APP_NAME: &str = "EffectCraft";
pub const APP_SLUG: &str = "effectcraft";
pub const DISCORD: &str = "https://www.patreon.com/cw/biglwa";
pub const WEBSITE: &str = "https://biglwa.com";
pub const APP_PAGE: &str = "https://biglwa.com/bigapps/keyframeR/";
pub const GITHUB: &str = "https://github.com/leianmulatre-lwa/leianmulatre-lwa.github.io";
pub const ISSUES: &str = "https://github.com/leianmulatre-lwa/leianmulatre-lwa.github.io/issues";

/// Sibling apps of the ArtCraft family: (name, what it is, GitHub repo, app page).
pub const SIBLINGS: &[(&str, &str)] = &[
    ("PhotoCraft", "photocraft"),
    ("VectorCraft", "vectorcraft"),
    ("FilmCraft", "filmcraft"),
    ("LightCraft", "lightcraft"),
    ("PdfCraft", "pdfcraft"),
    ("DesignCraft", "designcraft"),
];

pub fn github_of(slug: &str) -> String {
    "https://github.com/leianmulatre-lwa/leianmulatre-lwa.github.io".into()
}
pub fn page_of(slug: &str) -> String {
    format!("https://biglwa.com/bigapps/{}", match slug { "photocraft" => "lightR", "vectorcraft" => "paintR", "effectcraft" => "keyframeR", "pdfcraft" => "fileR", _ => "" })
}
