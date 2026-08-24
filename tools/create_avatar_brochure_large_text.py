from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "AI_Video_Presenter_Service_Brochure_Large_Text_EN.pdf"
PUBLIC_OUTPUT = ROOT / "public" / "ai-avatar" / "AI_Video_Presenter_Service_Brochure_Large_Text_EN.pdf"

TRADITIONAL = ROOT / "public" / "ai-avatar" / "assets" / "traditional-production.png"
AI_PRODUCTION = ROOT / "public" / "ai-avatar" / "assets" / "ai-avatar-production.png"
SCENARIOS = ROOT / "public" / "ai-avatar" / "assets" / "application-scenarios.png"
DR_XI = ROOT / "public" / "ai-avatar" / "assets" / "dr-xi-finance-poster.jpg"
CHENXI = ROOT / "public" / "ai-avatar" / "assets" / "chenxi-finance-poster.jpg"
VINCENT_PROFILE = ROOT / "public" / "ai-avatar" / "assets" / "prof-vincent-ho-profile.jpg"

SITE = "https://vibe-portfolio-dny.pages.dev/ai-avatar/"
LINKEDIN = "https://www.linkedin.com/in/ir-bo-alvin-liao-2b237b95/"

W, H = A4
NAVY = colors.HexColor("#07111F")
PANEL = colors.HexColor("#10253C")
PANEL_2 = colors.HexColor("#0B1B2D")
CYAN = colors.HexColor("#3CE8FF")
LIME = colors.HexColor("#B9F35D")
WHITE = colors.HexColor("#F6FAFF")
MUTED = colors.HexColor("#C7D4E1")
LINE = colors.Color(0.36, 0.67, 0.84, alpha=0.28)

styles = getSampleStyleSheet()
BODY = ParagraphStyle(
    "LargeBody",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=12.5,
    leading=17.5,
    textColor=MUTED,
)
BODY_WHITE = ParagraphStyle("LargeBodyWhite", parent=BODY, textColor=WHITE)
SMALL = ParagraphStyle(
    "LargeSmall",
    parent=BODY,
    fontSize=10.7,
    leading=14.8,
)
CENTER = ParagraphStyle("LargeCenter", parent=BODY, alignment=TA_CENTER)


def para(c, html, x, y_top, width, style=BODY):
    p = Paragraph(html, style)
    _, height = p.wrap(width, H)
    p.drawOn(c, x, y_top - height)
    return height


def page_bg(c):
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)


def round_rect(c, x, y, width, height, fill=PANEL, stroke=LINE, radius=5 * mm):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.roundRect(x, y, width, height, radius, fill=1, stroke=1)


def label(c, text, x, y, color=CYAN):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x, y, text.upper())


def heading(c, text, x, y, size=27, color=WHITE):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", size)
    c.drawString(x, y, text)


def footer(c, page_number):
    c.setStrokeColor(LINE)
    c.line(18 * mm, 15 * mm, W - 18 * mm, 15 * mm)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 9)
    c.drawString(18 * mm, 9 * mm, "AI Video Presenter Service - Large Text Edition")
    c.drawRightString(W - 18 * mm, 9 * mm, f"{page_number} / 12")


def button(c, text, url, x, y, width, height, fill=CYAN, text_color=NAVY):
    c.setFillColor(fill)
    c.setStrokeColor(fill)
    c.roundRect(x, y, width, height, 4 * mm, fill=1, stroke=1)
    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", 11)
    text_width = stringWidth(text, "Helvetica-Bold", 11)
    c.drawString(x + (width - text_width) / 2, y + height / 2 - 3.5, text)
    c.linkURL(url, (x, y, x + width, y + height), relative=0)


def bullet(c, text, x, y_top, width, color=LIME, style=BODY_WHITE):
    c.setFillColor(color)
    c.circle(x + 2 * mm, y_top - 4.5 * mm, 1.4 * mm, fill=1, stroke=0)
    return para(c, text, x + 7 * mm, y_top, width - 7 * mm, style)


def draw_cover(c):
    page_bg(c)
    c.setFillColor(colors.HexColor("#0B2841"))
    c.circle(W - 38 * mm, H - 38 * mm, 74 * mm, fill=1, stroke=0)
    label(c, "LARGE TEXT EDITION", 18 * mm, H - 27 * mm, LIME)
    heading(c, "Your face. Your voice.", 18 * mm, H - 55 * mm, 31)
    heading(c, "No camera each time.", 18 * mm, H - 72 * mm, 31, CYAN)
    para(
        c,
        "Create a realistic Personal AI Video Presenter. Once approved, send a script and receive a polished multilingual video without filming, memorising lines or repeating takes.",
        18 * mm,
        H - 88 * mm,
        124 * mm,
        BODY_WHITE,
    )
    button(c, "VIEW SERVICE", SITE, 18 * mm, H - 130 * mm, 52 * mm, 14 * mm)
    button(c, "CONTACT ALVIN", LINKEDIN, 75 * mm, H - 130 * mm, 52 * mm, 14 * mm, PANEL, WHITE)

    round_rect(c, 18 * mm, 35 * mm, W - 36 * mm, 96 * mm, PANEL_2, CYAN)
    label(c, "WHAT IT IS", 25 * mm, 119 * mm, LIME)
    heading(c, "Your on-demand video presenter", 25 * mm, 106 * mm, 21)
    para(
        c,
        "Not a cartoon avatar or Zoom character. It is a realistic video version of you, created from your authorised face and voice for future approved scripts.",
        25 * mm,
        97 * mm,
        150 * mm,
    )
    benefits = [
        ("YOUR FACE", "Authorised likeness"),
        ("YOUR VOICE", "Consented recreation"),
        ("REUSABLE", "Future scripts without a new shoot"),
    ]
    for index, (title, copy) in enumerate(benefits):
        x = 25 * mm + index * 55 * mm
        round_rect(c, x, 45 * mm, 50 * mm, 27 * mm, PANEL, LINE, 3 * mm)
        label(c, title, x + 4 * mm, 62 * mm, CYAN)
        para(c, copy, x + 4 * mm, 56 * mm, 42 * mm, SMALL)
    footer(c, 1)


def draw_story(c):
    page_bg(c)
    label(c, "WHY CLIENTS USE IT", 18 * mm, H - 25 * mm)
    heading(c, "From production day to content day", 18 * mm, H - 42 * mm, 27)
    para(c, "Spend less time filming and more time communicating.", 18 * mm, H - 53 * mm, 170 * mm)

    cards = [
        (
            18 * mm,
            "BEFORE - TRADITIONAL PRODUCTION",
            TRADITIONAL,
            ["Book a studio and crew.", "Rehearse or memorise the script.", "Repeat takes after mistakes or changes.", "Edit, caption and check the final cut."],
            "A late correction may require another filming round.",
        ),
        (
            108 * mm,
            "NOW - AI VIDEO PRESENTER",
            AI_PRODUCTION,
            ["Approve the script and visual plan.", "No studio, crew or rehearsal day.", "Keep delivery and captions consistent.", "Finish with human quality checks."],
            "Approved messages can be produced without a physical reshoot.",
        ),
    ]
    for x, title, image, points, note in cards:
        round_rect(c, x, 80 * mm, 84 * mm, 146 * mm, PANEL, CYAN if "NOW" in title else LINE)
        label(c, title, x + 5 * mm, 216 * mm, LIME if "NOW" in title else CYAN)
        c.drawImage(ImageReader(str(image)), x + 3 * mm, 163 * mm, 78 * mm, 44 * mm, preserveAspectRatio=True, anchor="c", mask="auto")
        y = 153 * mm
        for point in points:
            used = bullet(c, point, x + 5 * mm, y, 74 * mm, style=SMALL)
            y -= max(10 * mm, used + 3 * mm)
        c.setStrokeColor(LINE)
        c.line(x + 5 * mm, 104 * mm, x + 79 * mm, 104 * mm)
        para(c, f"<font color='#B9F35D'><b>{note}</b></font>", x + 5 * mm, 98 * mm, 74 * mm, SMALL)

    round_rect(c, 18 * mm, 31 * mm, W - 36 * mm, 37 * mm, PANEL_2, CYAN)
    heading(c, "The result", 25 * mm, 55 * mm, 18)
    para(c, "Lower production overhead, faster updates and no camera-day pressure.", 25 * mm, 47 * mm, 154 * mm, BODY_WHITE)
    footer(c, 2)


def draw_use_cases_one(c):
    page_bg(c)
    label(c, "APPLICATIONS - 1 OF 2", 18 * mm, H - 25 * mm)
    heading(c, "Build an audience. Teach consistently.", 18 * mm, H - 42 * mm, 25)
    para(c, "One approved presenter can support your personal channels and learning programmes.", 18 * mm, H - 53 * mm, 170 * mm)
    round_rect(c, 18 * mm, 135 * mm, W - 36 * mm, 94 * mm, PANEL_2, LINE)
    c.drawImage(ImageReader(str(SCENARIOS)), 21 * mm, 138 * mm, W - 42 * mm, 88 * mm, preserveAspectRatio=True, anchor="c", mask="auto")

    cards = [
        ("PERSONAL SOCIAL CHANNELS", "Publish expert updates and short-form series for X, TikTok, YouTube and Facebook - even when you have no time to record."),
        ("LESSONS", "Turn an approved lesson script into a consistent presenter-led video for online learning and knowledge sharing."),
        ("SAFETY TRAINING", "Create induction, toolbox talks and refresher training with clear narration, subtitles and selected languages."),
    ]
    for index, (title, copy) in enumerate(cards):
        x = 18 * mm + (index % 2) * 90 * mm
        y = 82 * mm if index < 2 else 31 * mm
        if index == 2:
            x = 63 * mm
        round_rect(c, x, y, 84 * mm, 43 * mm, PANEL, CYAN if index == 0 else LINE)
        label(c, title, x + 5 * mm, y + 32 * mm, LIME if index == 0 else CYAN)
        para(c, copy, x + 5 * mm, y + 25 * mm, 74 * mm, SMALL)
    footer(c, 3)


def draw_use_cases_two(c):
    page_bg(c)
    label(c, "APPLICATIONS - 2 OF 2", 18 * mm, H - 25 * mm)
    heading(c, "Speak, host and represent the brand", 18 * mm, H - 42 * mm, 25)
    para(c, "Use the same approved presence across important organisational moments.", 18 * mm, H - 53 * mm, 170 * mm)
    cards = [
        ("01", "INVITATIONS AND SPEECHES", "Event invitations, welcome messages, congratulatory remarks and formal speeches."),
        ("02", "EVENT OPENING VIDEOS", "Open conferences and safety activities with a confident, prepared message."),
        ("03", "EMPLOYEE TOWN HALLS", "Deliver management updates and staff briefings with consistent wording and tone."),
        ("04", "SAFETY PROMOTION", "Support campaigns, safety days and awareness activities with repeatable content."),
        ("05", "SAFETY PRODUCTS", "Explain corporate safety products, services and practical solutions."),
        ("06", "SAFETY CULTURE SPOKESPERSON", "Represent the organisation's safety values across campaigns and languages."),
    ]
    top = H - 75 * mm
    for index, (number, title, copy) in enumerate(cards):
        col, row = index % 2, index // 2
        x = 18 * mm + col * 90 * mm
        y = top - row * 58 * mm - 52 * mm
        round_rect(c, x, y, 84 * mm, 52 * mm, PANEL, CYAN if index == 0 else LINE)
        c.setFillColor(CYAN)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(x + 5 * mm, y + 36 * mm, number)
        label(c, title, x + 18 * mm, y + 38 * mm, LIME if index == 0 else CYAN)
        para(c, copy, x + 5 * mm, y + 27 * mm, 74 * mm, SMALL)
    round_rect(c, 18 * mm, 27 * mm, W - 36 * mm, 25 * mm, PANEL_2, LIME)
    para(c, "<b>You decide the message. Your approved presenter delivers it without camera-day pressure.</b>", 25 * mm, 45 * mm, 160 * mm, BODY_WHITE)
    footer(c, 4)


def draw_short_packages(c):
    page_bg(c)
    label(c, "SHORT-FORM PACKAGES", 18 * mm, H - 25 * mm)
    heading(c, "Start with one. Save as you scale.", 18 * mm, H - 42 * mm, 27)
    para(c, "Every short-form video is up to 90 seconds and includes one selected language.", 18 * mm, H - 53 * mm, 170 * mm)
    plans = [
        ("SINGLE VIDEO", "US$39", "1 video", "One-off"),
        ("MONTHLY 4", "US$140", "4 videos - US$35 each", "Use within one month"),
        ("GROWTH 8", "US$248", "8 videos - US$31 each", "Valid for 3 months"),
        ("PARTNER 12", "US$324", "12 videos - US$27 each", "Valid for 6 months"),
    ]
    for index, (name, price, quantity, validity) in enumerate(plans):
        col, row = index % 2, index // 2
        x = 18 * mm + col * 90 * mm
        y = 133 * mm - row * 73 * mm
        round_rect(c, x, y, 84 * mm, 62 * mm, PANEL if index != 1 else colors.HexColor("#123552"), CYAN if index == 1 else LINE)
        label(c, name, x + 6 * mm, y + 49 * mm, LIME if index == 1 else CYAN)
        heading(c, price, x + 6 * mm, y + 31 * mm, 24)
        para(c, f"<b>{quantity}</b><br/>Each up to 90 seconds<br/>{validity}", x + 6 * mm, y + 23 * mm, 72 * mm, SMALL)
        c.linkURL(LINKEDIN, (x, y, x + 84 * mm, y + 62 * mm), relative=0)
    button(c, "DISCUSS A PACKAGE", LINKEDIN, 18 * mm, 28 * mm, 65 * mm, 14 * mm)
    footer(c, 5)


def draw_inclusions(c):
    page_bg(c)
    label(c, "WHAT IS INCLUDED", 18 * mm, H - 25 * mm)
    heading(c, "Clear scope before production begins", 18 * mm, H - 42 * mm, 26)
    para(c, "Every material choice is reviewed before you approve generation.", 18 * mm, H - 53 * mm, 170 * mm)
    round_rect(c, 18 * mm, 139 * mm, W - 36 * mm, 88 * mm, PANEL_2, CYAN)
    items = [
        "Client-supplied approved script",
        "Basic AI grammar and clarity check",
        "Branded background",
        "Narration and subtitles in one language",
        "1080p MP4 delivery",
        "One consolidated pre-generation review",
    ]
    for index, item in enumerate(items):
        col, row = index % 2, index // 2
        x = 25 * mm + col * 84 * mm
        y = 210 * mm - row * 21 * mm
        bullet(c, item, x, y, 78 * mm, style=SMALL)

    round_rect(c, 18 * mm, 78 * mm, 84 * mm, 50 * mm, PANEL, LINE)
    label(c, "STANDARD AI PRESENTER", 24 * mm, 116 * mm)
    para(c, "A ready-made professional presenter and voice. Included in the listed video prices.", 24 * mm, 106 * mm, 72 * mm, SMALL)
    round_rect(c, 108 * mm, 78 * mm, 84 * mm, 50 * mm, PANEL, LIME)
    label(c, "PERSONAL AI VIDEO PRESENTER", 114 * mm, 116 * mm, LIME)
    para(c, "Your authorised face and voice. A separate one-time setup quoted before work begins.", 114 * mm, 106 * mm, 72 * mm, SMALL)

    round_rect(c, 18 * mm, 31 * mm, W - 36 * mm, 36 * mm, PANEL_2, LINE)
    heading(c, "Any selected language", 25 * mm, 54 * mm, 18)
    para(c, "One narration and subtitle language is included per video. Additional language versions are US$26 each.", 25 * mm, 46 * mm, 155 * mm, SMALL)
    footer(c, 6)


def draw_longform(c):
    page_bg(c)
    label(c, "LONG-FORM PRODUCTION", 18 * mm, H - 25 * mm)
    heading(c, "Longer messages. Clear maximum runtime.", 18 * mm, H - 42 * mm, 25)
    para(c, "Each price below covers one finished video up to the stated duration.", 18 * mm, H - 53 * mm, 170 * mm)
    tiers = [
        ("UP TO 3 MIN", "US$51"),
        ("UP TO 5 MIN", "US$64"),
        ("UP TO 10 MIN", "US$90"),
        ("UP TO 20 MIN", "US$115"),
        ("UP TO 30 MIN", "US$141"),
    ]
    for index, (duration, price) in enumerate(tiers):
        if index < 3:
            x = 18 * mm + index * 59 * mm
            y = 147 * mm
        else:
            x = 47.5 * mm + (index - 3) * 70 * mm
            y = 90 * mm
        width = 54 * mm if index < 3 else 64 * mm
        round_rect(c, x, y, width, 48 * mm, colors.HexColor("#143B4D") if index == 4 else PANEL, LIME if index == 4 else LINE)
        label(c, f"1 VIDEO - {duration}", x + 5 * mm, y + 35 * mm, LIME if index == 4 else CYAN)
        heading(c, price, x + 5 * mm, y + 17 * mm, 22)
        c.linkURL(LINKEDIN, (x, y, x + width, y + 48 * mm), relative=0)

    round_rect(c, 18 * mm, 31 * mm, W - 36 * mm, 45 * mm, PANEL_2, CYAN)
    label(c, "IMPORTANT FOR LONG VIDEOS", 25 * mm, 64 * mm, LIME)
    para(c, "For videos longer than 10 minutes, one approval covers the complete script and visual plan. Production may then be completed in sections and assembled into one final video.", 25 * mm, 55 * mm, 158 * mm, SMALL)
    footer(c, 7)


def draw_brief(c):
    page_bg(c)
    label(c, "WHAT WE NEED FROM YOU", 18 * mm, H - 25 * mm)
    heading(c, "Six items before generation", 18 * mm, H - 42 * mm, 27)
    para(c, "Accurate information at this stage prevents avoidable regeneration costs.", 18 * mm, H - 53 * mm, 170 * mm)
    items = [
        ("01", "FINAL SCRIPT", "Correct names, titles, dates and pronunciation notes."),
        ("02", "AUDIENCE AND TONE", "Who will watch, and whether delivery should be formal, warm or energetic."),
        ("03", "BRAND ASSETS", "Logo, colours, background and required visual elements."),
        ("04", "LANGUAGE AND VOICE", "Narration language, subtitle language, presenter, voice and timing."),
        ("05", "RIGHTS AND CONSENT", "You must own supplied assets and approve custom likeness or voice use."),
        ("06", "FINAL APPROVAL", "Review the summary and reply: Approved to generate."),
    ]
    top = H - 75 * mm
    for index, (number, title, copy) in enumerate(items):
        col, row = index % 2, index // 2
        x = 18 * mm + col * 90 * mm
        y = top - row * 60 * mm - 50 * mm
        round_rect(c, x, y, 84 * mm, 50 * mm, PANEL, CYAN if index == 5 else LINE)
        c.setFillColor(CYAN)
        c.setFont("Helvetica-Bold", 19)
        c.drawString(x + 5 * mm, y + 34 * mm, number)
        label(c, title, x + 19 * mm, y + 36 * mm, LIME if index == 5 else CYAN)
        para(c, copy, x + 5 * mm, y + 25 * mm, 74 * mm, SMALL)
    footer(c, 8)


def draw_approval(c):
    page_bg(c)
    label(c, "APPROVAL AND CHANGES", 18 * mm, H - 25 * mm)
    heading(c, "Review first. Generate once.", 18 * mm, H - 42 * mm, 27)
    para(c, "Every important choice is validated before the video is generated.", 18 * mm, H - 53 * mm, 170 * mm)
    steps = [
        ("1", "SELECT", "Choose a package and duration."),
        ("2", "SUBMIT", "Send the script, assets and requirements."),
        ("3", "REVIEW", "Check language, voice, timing, visuals and facts."),
        ("4", "APPROVE", "Reply: Approved to generate."),
        ("5", "DELIVER", "We generate, quality-check and deliver the MP4."),
    ]
    y = 230 * mm
    for number, title, copy in steps:
        c.setFillColor(CYAN)
        c.circle(29 * mm, y + 2 * mm, 6 * mm, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 12)
        c.drawCentredString(29 * mm, y - 1.5 * mm, number)
        label(c, title, 42 * mm, y + 5 * mm, LIME if number == "4" else CYAN)
        para(c, copy, 42 * mm, y - 2 * mm, 142 * mm, BODY_WHITE)
        if number != "5":
            c.setStrokeColor(LINE)
            c.line(29 * mm, y - 8 * mm, 29 * mm, y - 24 * mm)
        y -= 34 * mm

    round_rect(c, 18 * mm, 31 * mm, W - 36 * mm, 47 * mm, PANEL_2, LIME)
    label(c, "CHANGE POLICY", 25 * mm, 65 * mm, LIME)
    para(c, "One consolidated pre-generation review is included. Client-requested changes after generation are charged. Any mismatch against the approved brief is corrected without charge.", 25 * mm, 56 * mm, 158 * mm, SMALL)
    footer(c, 9)


def draw_testimonial(c):
    page_bg(c)
    label(c, "CLIENT TESTIMONIAL", 18 * mm, H - 25 * mm, LIME)
    heading(c, "Zero takes, and it is done!!", 18 * mm, H - 44 * mm, 27, CYAN)

    round_rect(c, 18 * mm, 36 * mm, W - 36 * mm, 192 * mm, PANEL_2, CYAN)
    c.saveState()
    profile_x, profile_y, profile_size = 71 * mm, 151 * mm, 68 * mm
    profile_path = c.beginPath()
    profile_path.circle(profile_x + profile_size / 2, profile_y + profile_size / 2, profile_size / 2)
    c.clipPath(profile_path, stroke=0, fill=0)
    c.drawImage(ImageReader(str(VINCENT_PROFILE)), profile_x, profile_y, profile_size, profile_size, mask="auto")
    c.restoreState()
    c.setStrokeColor(CYAN)
    c.setLineWidth(1.8)
    c.circle(profile_x + profile_size / 2, profile_y + profile_size / 2, profile_size / 2, fill=0, stroke=1)

    label(c, "IN HIS OWN WORDS", 25 * mm, 139 * mm, LIME)
    quote_style = ParagraphStyle("LargeTestimonialQuote", parent=BODY_WHITE, fontSize=16, leading=22)
    para(
        c,
        "<b>\"No studio, no memorising scripts, and no repeated takes. This service turned my script into a realistic, professional video message - saving me hours while preserving my appearance, voice, and personal delivery. Zero takes, and it is done!!\"</b>",
        25 * mm,
        126 * mm,
        160 * mm,
        quote_style,
    )
    c.setStrokeColor(LIME)
    c.setLineWidth(2)
    c.line(25 * mm, 45 * mm, 25 * mm, 70 * mm)
    heading(c, "Professor Vincent Ho", 33 * mm, 61 * mm, 18)
    para(c, "Secretary General, APOSHO", 33 * mm, 52 * mm, 120 * mm, BODY_WHITE)
    footer(c, 10)


def draw_demos(c):
    page_bg(c)
    label(c, "CLIENT-SUPPLIED DEMOS", 18 * mm, H - 25 * mm)
    heading(c, "See the service in action", 18 * mm, H - 42 * mm, 27)
    para(c, "Two examples of presenter-led finance communication.", 18 * mm, H - 53 * mm, 170 * mm)
    demos = [
        (DR_XI, "Dr. Xi - Finance Briefing", "Calm Mandarin finance briefing with an executive presence.", SITE + "#demo-dr-xi"),
        (CHENXI, "Chenxi - Finance Presenter", "Mandarin market update with broadcast-style finance graphics.", SITE + "#demo-chenxi"),
    ]
    for index, (poster, title, copy, url) in enumerate(demos):
        x = 18 * mm + index * 90 * mm
        round_rect(c, x, 91 * mm, 84 * mm, 130 * mm, PANEL, CYAN if index == 0 else LINE)
        c.drawImage(ImageReader(str(poster)), x + 4 * mm, 150 * mm, 76 * mm, 58 * mm, preserveAspectRatio=True, anchor="c", mask="auto")
        heading(c, title, x + 6 * mm, 139 * mm, 17)
        para(c, copy, x + 6 * mm, 129 * mm, 72 * mm, SMALL)
        button(c, "WATCH DEMO", url, x + 6 * mm, 101 * mm, 50 * mm, 13 * mm, PANEL_2, CYAN)
    para(c, "Demo media is client-supplied. Customers must hold the necessary rights and written consent for custom likeness, voice and supplied media.", 18 * mm, 74 * mm, 174 * mm, SMALL)
    button(c, "VIEW ALL DEMOS", SITE, 18 * mm, 31 * mm, 58 * mm, 14 * mm)
    footer(c, 11)


def draw_addons(c):
    page_bg(c)
    label(c, "OPTIONAL ADD-ONS", 18 * mm, H - 25 * mm)
    heading(c, "Extra services when you need them", 18 * mm, H - 42 * mm, 26)
    para(c, "Confirm every add-on before production begins.", 18 * mm, H - 53 * mm, 170 * mm)
    addons = [
        ("Long-form runtime", "Up to 30 min"),
        ("Post-generation minor change", "From US$13"),
        ("Script polish", "US$19"),
        ("Full scriptwriting", "US$39+"),
        ("Personal presenter setup", "Quoted separately"),
        ("Custom background", "US$26+"),
        ("Additional language version", "US$26"),
        ("24-hour rush", "+30%"),
        ("Major regeneration after approval", "From US$26"),
    ]
    for index, (name, price) in enumerate(addons):
        col, row = index % 2, index // 2
        x = 18 * mm + col * 90 * mm
        y = 205 * mm - row * 31 * mm
        round_rect(c, x, y, 84 * mm, 24 * mm, PANEL, LINE, 3 * mm)
        para(c, f"<b>{name}</b><br/><font color='#B9F35D'>{price}</font>", x + 5 * mm, y + 18 * mm, 74 * mm, SMALL)

    round_rect(c, 18 * mm, 31 * mm, W - 36 * mm, 47 * mm, colors.HexColor("#123552"), CYAN)
    heading(c, "Ready to create your video?", 25 * mm, 63 * mm, 20)
    para(c, "Contact Alvin on LinkedIn to confirm a package or discuss your brief.", 25 * mm, 53 * mm, 98 * mm, SMALL)
    button(c, "CONTACT ON LINKEDIN", LINKEDIN, W - 79 * mm, 43 * mm, 55 * mm, 14 * mm)
    footer(c, 12)


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    c.setTitle("AI Video Presenter Service - Large Text Edition")
    c.setAuthor("Alvin Liao - Safety Nexus")
    c.setSubject("Large-text AI Video Presenter service brochure")
    pages = (
        draw_cover,
        draw_story,
        draw_use_cases_one,
        draw_use_cases_two,
        draw_short_packages,
        draw_inclusions,
        draw_longform,
        draw_brief,
        draw_approval,
        draw_testimonial,
        draw_demos,
        draw_addons,
    )
    for page in pages:
        page(c)
        c.showPage()
    c.save()
    PUBLIC_OUTPUT.write_bytes(OUTPUT.read_bytes())
    print(OUTPUT)
    print(PUBLIC_OUTPUT)


if __name__ == "__main__":
    build()
