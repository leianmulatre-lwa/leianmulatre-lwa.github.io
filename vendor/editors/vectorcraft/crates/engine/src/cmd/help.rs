//! Help → community and project links (the ArtCraft Discord, website, this app's page and its
//! GitHub repository). The commands return the URL; the frontend opens it.

use serde_json::{Value, json};

use super::*;

/// The app's id on getartcraft.com and GitHub.
pub const APP_ID: &str = "vectorcraft";
pub const DISCORD_URL: &str = "https://www.patreon.com/cw/biglwa";
pub const WEBSITE_URL: &str = "https://biglwa.com";

/// This app's page on the website.
pub fn app_page_url() -> String {
    format!("{WEBSITE_URL}/bigapps/paintR/")
}

/// This app's source repository.
pub fn github_url() -> String {
    "https://github.com/leianmulatre-lwa/leianmulatre-lwa.github.io".into()
}

pub fn specs() -> Vec<CommandSpec> {
    vec![
        cmd!(query "help.discord", "Support BIG LWA on Patreon", ["Help"], None, "{} → {url} the ArtCraft community Discord", always, |_, _| url(DISCORD_URL.into())),
        cmd!(query "help.website", "BIG LWA Workshop", ["Help"], None, "{} → {url}", always, |_, _| url(WEBSITE_URL.into())),
        cmd!(query "help.appPage", "paintR · BIG LWA", ["Help"], None, "{} → {url} this app's page", always, |_, _| url(app_page_url())),
        cmd!(query "help.github", "BIG LWA GitHub", ["Help"], None, "{} → {url} source code, issues and releases", always, |_, _| url(github_url())),
        cmd!(query "help.links", "Links", [], None, "{} → {discord, website, appPage, github}", always, |_, _| {
            Ok(json!({ "discord": DISCORD_URL, "website": WEBSITE_URL, "appPage": app_page_url(), "github": github_url() }))
        }),
    ]
}

fn url(u: String) -> Result<Value> {
    Ok(json!({ "url": u }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn links() {
        let mut s = Session::new();
        assert_eq!(s.execute("help.discord", &json!({})).unwrap()["url"], "https://www.patreon.com/cw/biglwa");
        assert_eq!(s.execute("help.appPage", &json!({})).unwrap()["url"], "https://biglwa.com/bigapps/paintR/");
        assert_eq!(s.execute("help.github", &json!({})).unwrap()["url"], "https://github.com/leianmulatre-lwa/leianmulatre-lwa.github.io");
        assert_eq!(s.execute("help.links", &json!({})).unwrap()["website"], "https://biglwa.com");
    }
}
