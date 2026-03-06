import fs from "fs/promises";
import path from "path";
import { chromium } from "playwright";

const url = "https://dgsspares.dgstechlimited.com/";

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle" });

  const selectors = await page.evaluate(() => {
    const css = (el, prop) => getComputedStyle(el).getPropertyValue(prop).trim();
    const isTransparent = (value) =>
      value === "transparent" || value.startsWith("rgba(0, 0, 0, 0)");

    const isVisible = (el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const candidateButton = Array.from(
      document.querySelectorAll("button, a, .btn, .MuiButton-root"),
    ).find((el) => {
      const bg = css(el, "background-color");
      return isVisible(el) && !isTransparent(bg) && bg !== "rgb(255, 255, 255)";
    });

    const cardSelectors = [".card", ".panel", ".MuiPaper-root", "[data-card]"];
    const cardCandidates = cardSelectors.flatMap((sel) =>
      Array.from(document.querySelectorAll(sel)),
    );
    const genericCandidates = Array.from(document.querySelectorAll("div, section, article"));
    const isBadCard = (el) => {
      const className = (el.className || "").toString().toLowerCase();
      return (
        className.includes("preloader") ||
        className.includes("overlay") ||
        className.includes("modal") ||
        className.includes("close")
      );
    };

    const candidateCard = [...cardCandidates, ...genericCandidates].find((el) => {
      const bg = css(el, "background-color");
      const shadow = css(el, "box-shadow");
      const border = css(el, "border-color");
      return (
        isVisible(el) &&
        !isBadCard(el) &&
        !isTransparent(bg) &&
        bg !== "rgba(0, 0, 0, 0)" &&
        (shadow !== "none" || !isTransparent(border))
      );
    });

    const candidateNav = Array.from(
      document.querySelectorAll('nav, aside, header, [role="navigation"]'),
    ).find((el) => {
      const bg = css(el, "background-color");
      return isVisible(el) && !isTransparent(bg) && bg !== "rgba(0, 0, 0, 0)";
    });

    const navItem = candidateNav
      ? candidateNav.querySelector('a, button, [role="link"]')
      : document.querySelector('nav a, nav button, nav [role="link"]');

    const candidateTableHead = document.querySelector("thead, .table thead, .MuiTableHead-root");

    const muted =
      document.querySelector(
        '[class*="muted"], [data-muted], .text-muted, .text-secondary, .MuiTypography-colorTextSecondary',
      ) || document.querySelector("small, .caption, .subtle");

    if (candidateButton) candidateButton.setAttribute("data-dgs-button", "true");
    if (candidateCard) candidateCard.setAttribute("data-dgs-card", "true");
    if (candidateCard) {
      const cardBg = css(candidateCard, "background-color");
      const surface2Candidate = Array.from(document.querySelectorAll("div, section, article")).find(
        (el) => {
          const bg = css(el, "background-color");
          return (
            isVisible(el) &&
            !isTransparent(bg) &&
            bg !== cardBg &&
            bg !== css(document.body, "background-color")
          );
        },
      );
      if (surface2Candidate) surface2Candidate.setAttribute("data-dgs-surface2", "true");
    }
    if (candidateNav) candidateNav.setAttribute("data-dgs-nav", "true");
    if (navItem) navItem.setAttribute("data-dgs-nav-item", "true");
    if (candidateTableHead) candidateTableHead.setAttribute("data-dgs-table", "true");
    if (muted) muted.setAttribute("data-dgs-muted", "true");

    return {
      nav: '[data-dgs-nav="true"]',
      card: '[data-dgs-card="true"]',
      button: '[data-dgs-button="true"]',
      tableHead: '[data-dgs-table="true"]',
      muted: '[data-dgs-muted="true"]',
      navItem: '[data-dgs-nav-item="true"]',
      surface2: '[data-dgs-surface2="true"]',
    };
  });

  const baseTokens = await page.evaluate(() => {
    const css = (el, prop) => getComputedStyle(el).getPropertyValue(prop).trim();
    const pick = (sel) => document.querySelector(sel);

    const body = document.body;
    const nav = pick('[data-dgs-nav="true"]') || body;
    const card = pick('[data-dgs-card="true"]') || body;
    const btn = pick('[data-dgs-button="true"]') || body;
    const tableHead = pick('[data-dgs-table="true"]') || body;
    const muted = pick('[data-dgs-muted="true"]') || body;

    return {
      bg: css(body, "background-color"),
      bgImage: css(body, "background-image"),
      text: css(body, "color"),
      font: css(body, "font-family"),

      surface: css(card, "background-color"),
      surfaceBorder: css(card, "border-color"),
      shadow1: css(card, "box-shadow"),
      radiusMd: css(card, "border-radius"),

      navBg: css(nav, "background-color"),
      navText: css(nav, "color"),

      primary: css(btn, "background-color"),
      primaryText: css(btn, "color"),
      primaryBorder: css(btn, "border-color"),

      tableHeadBg: css(tableHead, "background-color"),
      tableHeadText: css(tableHead, "color"),

      muted: css(muted, "color"),
    };
  });

  const hoverTokens = {
    primaryHover: null,
    primaryActive: null,
    navHoverBg: null,
    navActiveBg: null,
    navActiveIndicator: null,
    surface2: null,
    shadow2: null,
    radiusSm: null,
  };

  if (selectors.button) {
    const buttonVisible = await page.$eval(selectors.button, (el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (buttonVisible) {
      try {
        await page.hover(selectors.button, { timeout: 3000 });
        hoverTokens.primaryHover = await page.$eval(selectors.button, (el) =>
          getComputedStyle(el).getPropertyValue("background-color").trim(),
        );
      } catch {
        // ignore hover failure
      }
      await page.dispatchEvent(selectors.button, "mousedown");
      hoverTokens.primaryActive = await page.$eval(selectors.button, (el) =>
        getComputedStyle(el).getPropertyValue("background-color").trim(),
      );
      await page.dispatchEvent(selectors.button, "mouseup");
      hoverTokens.radiusSm = await page.$eval(selectors.button, (el) =>
        getComputedStyle(el).getPropertyValue("border-radius").trim(),
      );
    }
  }

  if (selectors.card) {
    const cardVisible = await page.$eval(selectors.card, (el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (cardVisible) {
      try {
        await page.hover(selectors.card, { timeout: 3000 });
        hoverTokens.surface2 = await page.$eval(selectors.card, (el) =>
          getComputedStyle(el).getPropertyValue("background-color").trim(),
        );
        hoverTokens.shadow2 = await page.$eval(selectors.card, (el) =>
          getComputedStyle(el).getPropertyValue("box-shadow").trim(),
        );
      } catch {
        // Ignore hover failures on protected layers
      }
    }
  }

  if (selectors.surface2 && !hoverTokens.surface2) {
    hoverTokens.surface2 = await page.$eval(selectors.surface2, (el) =>
      getComputedStyle(el).getPropertyValue("background-color").trim(),
    );
  }

  const navActiveSelector = await page.evaluate(() => {
    const active =
      document.querySelector('[aria-current="page"]') ||
      document.querySelector(".active, .is-active, .Mui-selected");
    const navItem = active || document.querySelector('[data-dgs-nav-item="true"]');
    if (!navItem) return null;
    if (navItem.id) return `#${navItem.id}`;
    const className =
      navItem.className && typeof navItem.className === "string"
        ? navItem.className.split(" ")[0]
        : null;
    return className ? `.${className}` : navItem.tagName.toLowerCase();
  });

  const navHoverSelector = selectors.navItem || null;

  if (navHoverSelector) {
    await page.hover(navHoverSelector);
    hoverTokens.navHoverBg = await page.$eval(navHoverSelector, (el) =>
      getComputedStyle(el).getPropertyValue("background-color").trim(),
    );
  }

  if (navActiveSelector) {
    hoverTokens.navActiveBg = await page.$eval(navActiveSelector, (el) =>
      getComputedStyle(el).getPropertyValue("background-color").trim(),
    );
    hoverTokens.navActiveIndicator = await page.$eval(navActiveSelector, (el) => {
      const styles = getComputedStyle(el);
      const left = styles.getPropertyValue("border-left-color").trim();
      const bottom = styles.getPropertyValue("border-bottom-color").trim();
      const border = styles.getPropertyValue("border-color").trim();
      return left || bottom || border;
    });
  }

  const output = {
    bg: baseTokens.bg,
    bgImage: baseTokens.bgImage,
    surface: baseTokens.surface,
    surface2: hoverTokens.surface2 || baseTokens.surface,
    border: baseTokens.surfaceBorder,
    text: baseTokens.text,
    muted: baseTokens.muted,
    primary: baseTokens.primary,
    primaryHover: hoverTokens.primaryHover || baseTokens.primary,
    primaryActive: hoverTokens.primaryActive || baseTokens.primary,
    navBg: baseTokens.navBg,
    navHoverBg: hoverTokens.navHoverBg || "transparent",
    navActiveBg: hoverTokens.navActiveBg || "transparent",
    navActiveIndicator: hoverTokens.navActiveIndicator || baseTokens.text,
    tableHeadBg: baseTokens.tableHeadBg,
    radiusSm: hoverTokens.radiusSm || baseTokens.radiusMd,
    radiusMd: baseTokens.radiusMd,
    shadow1: baseTokens.shadow1,
    shadow2: hoverTokens.shadow2 || baseTokens.shadow1,
    font: baseTokens.font,
  };

  const outputPath = path.join(process.cwd(), "dgs-reference-tokens.json");
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));

  console.log(JSON.stringify(output, null, 2));

  await browser.close();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
