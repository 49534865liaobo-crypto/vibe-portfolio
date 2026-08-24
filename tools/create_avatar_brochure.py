from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.utils import ImageReader


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "AI_Avatar_Video_Service_Brochure_EN.pdf"
PUBLIC_OUTPUT = ROOT / "public" / "ai-avatar" / "AI_Avatar_Video_Service_Brochure_EN.pdf"
DR_XI_POSTER = ROOT / "public" / "ai-avatar" / "assets" / "dr-xi-finance-poster.jpg"
CHENXI_POSTER = ROOT / "public" / "ai-avatar" / "assets" / "chenxi-finance-poster.jpg"
TRADITIONAL_PRODUCTION = ROOT / "public" / "ai-avatar" / "assets" / "traditional-production.png"
AI_AVATAR_PRODUCTION = ROOT / "public" / "ai-avatar" / "assets" / "ai-avatar-production.png"

SITE = "https://vibe-portfolio-dny.pages.dev/ai-avatar/"
PDF_LINK = SITE + "AI_Avatar_Video_Service_Brochure_EN.pdf"
LINKEDIN = "https://www.linkedin.com/in/ir-bo-alvin-liao-2b237b95/"

W, H = A4
NAVY = colors.HexColor("#07111F")
PANEL = colors.HexColor("#10253C")
PANEL_2 = colors.HexColor("#0B1B2D")
CYAN = colors.HexColor("#3CE8FF")
LIME = colors.HexColor("#B9F35D")
WHITE = colors.HexColor("#F6FAFF")
MUTED = colors.HexColor("#A7B8CC")
LINE = colors.Color(0.36, 0.67, 0.84, alpha=0.24)

styles = getSampleStyleSheet()
BODY = ParagraphStyle("Body", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.1, leading=13.2, textColor=MUTED)
BODY_WHITE = ParagraphStyle("BodyWhite", parent=BODY, textColor=WHITE)
SMALL = ParagraphStyle("Small", parent=BODY, fontSize=7.7, leading=10.4)
CENTER = ParagraphStyle("Center", parent=BODY, alignment=TA_CENTER)


def para(c, html, x, y_top, width, style=BODY):
    p = Paragraph(html, style)
    _, h = p.wrap(width, H)
    p.drawOn(c, x, y_top - h)
    return h


def round_rect(c, x, y, w, h, fill=PANEL, stroke=LINE, radius=5 * mm):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)


def label(c, text, x, y, color=CYAN):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 7.4)
    c.drawString(x, y, text.upper())


def heading(c, text, x, y, size=26, color=WHITE):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", size)
    c.drawString(x, y, text)


def footer(c, page_num):
    c.setStrokeColor(LINE)
    c.line(18 * mm, 15 * mm, W - 18 * mm, 15 * mm)
    c.setFont("Helvetica", 7.2)
    c.setFillColor(MUTED)
    c.drawString(18 * mm, 9.5 * mm, "AI Avatar Video Service · Safety Nexus")
    c.drawRightString(W - 18 * mm, 9.5 * mm, f"{page_num} / 6")


def link_button(c, text, url, x, y, w, h, fill=CYAN, text_color=NAVY):
    c.setFillColor(fill)
    c.setStrokeColor(fill)
    c.roundRect(x, y, w, h, 4 * mm, fill=1, stroke=1)
    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", 8.4)
    tw = stringWidth(text, "Helvetica-Bold", 8.4)
    c.drawString(x + (w - tw) / 2, y + h / 2 - 2.8, text)
    c.linkURL(url, (x, y, x + w, y + h), relative=0)


def draw_cover(c):
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#0B2841"))
    c.circle(W - 40 * mm, H - 35 * mm, 72 * mm, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#0E3850"))
    c.circle(W - 22 * mm, H - 8 * mm, 32 * mm, fill=1, stroke=0)
    label(c, "PERSONAL AI VIDEO PRODUCTION", 18 * mm, H - 28 * mm)
    heading(c, "Your face. Your voice.", 18 * mm, H - 53 * mm, 31)
    heading(c, "No camera each time.", 18 * mm, H - 69 * mm, 31, CYAN)
    para(c, "Create a realistic personal AI presenter. Once approved, send a script and receive a polished multilingual video without filming, memorising lines or repeating takes.", 18 * mm, H - 82 * mm, 118 * mm, BODY_WHITE)
    link_button(c, "VIEW SERVICE & DEMOS", SITE, 18 * mm, H - 119 * mm, 52 * mm, 13 * mm)
    link_button(c, "CONTACT ON LINKEDIN", LINKEDIN, 74 * mm, H - 119 * mm, 54 * mm, 13 * mm, PANEL, WHITE)

    round_rect(c, 18 * mm, 33 * mm, W - 36 * mm, 109 * mm, PANEL_2)
    label(c, "WHAT THIS SERVICE ACTUALLY DOES", 25 * mm, 128 * mm, LIME)
    heading(c, "Your on-demand video presenter.", 25 * mm, 116 * mm, 19)
    para(c, "Not a cartoon avatar or Zoom character. It is a realistic presenter created from your authorised face and voice, then reused for future approved scripts.", 25 * mm, 109 * mm, 150 * mm, SMALL)
    signals = [
        ("YOUR FACE", "Authorised likeness"),
        ("YOUR VOICE", "Consented recreation"),
        ("MULTILINGUAL", "Selected voice + subtitles"),
        ("REUSABLE", "Future scripts, no new shoot"),
    ]
    card_w = 76 * mm
    card_h = 25 * mm
    for i, (name, detail) in enumerate(signals):
        col, row = i % 2, i // 2
        x = 25 * mm + col * 82 * mm
        y = 68 * mm - row * 31 * mm
        round_rect(c, x, y, card_w, card_h, PANEL, CYAN if i == 0 else LINE, 3 * mm)
        label(c, name, x + 5 * mm, y + 15 * mm, LIME if i == 0 else CYAN)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7.4)
        c.drawString(x + 5 * mm, y + 7 * mm, detail)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.2)
    c.drawString(25 * mm, 39 * mm, "Video production from US$39 · personal AI presenter setup quoted separately")
    footer(c, 1)


def draw_story(c):
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    label(c, "THE PRODUCTION STORY", 18 * mm, H - 24 * mm)
    heading(c, "From production marathon to controlled flow.", 18 * mm, H - 39 * mm, 23)
    para(c, "Spend less time filming and more time communicating. AI Avatar production keeps creative judgement and human review, while reducing production overhead, scheduling pressure and repeated on-camera takes.", 18 * mm, H - 47 * mm, 174 * mm)

    card_y = 101 * mm
    card_h = 126 * mm
    card_w = 84 * mm
    image_w = 78 * mm
    image_h = 44 * mm
    cards = [
        (
            18 * mm,
            "BEFORE · TRADITIONAL PRODUCTION",
            TRADITIONAL_PRODUCTION,
            "Studio booking, crew, lighting and sound, wardrobe and setup.<br/>Rehearsal, memorising or teleprompter practice.<br/>Camera pressure and multiple takes - the familiar on-camera <i>NG</i> moments.<br/>Editing, captions, factual checks, approval, publishing and costly late corrections.",
            "Time cost: every meaningful change can mean another round of filming.",
        ),
        (
            108 * mm,
            "NOW · AI AVATAR PRODUCTION",
            AI_AVATAR_PRODUCTION,
            "Validate the script, delivery and visuals, then confirm 'Approved to generate' in writing.<br/>A basic AI-assisted grammar and clarity pass flags obvious issues before generation.<br/>No studio, crew, rehearsal or physical reshoot required.<br/>Keep delivery, background and captions consistent.<br/>Finish with human QA before publish.",
            "Technical rerenders needed to match the approved brief are included. Client-requested changes after generation are chargeable.",
        ),
    ]
    for x, title, image, body, note in cards:
        round_rect(c, x, card_y, card_w, card_h, PANEL, CYAN if "NOW" in title else LINE, 4 * mm)
        label(c, title, x + 5 * mm, card_y + card_h - 9 * mm, LIME if "NOW" in title else CYAN)
        c.drawImage(ImageReader(str(image)), x + 3 * mm, card_y + card_h - 55 * mm, image_w, image_h, preserveAspectRatio=True, anchor="c", mask="auto")
        para(c, body, x + 5 * mm, card_y + card_h - 61 * mm, card_w - 10 * mm, SMALL)
        c.setStrokeColor(LINE)
        c.line(x + 5 * mm, card_y + 17 * mm, x + card_w - 5 * mm, card_y + 17 * mm)
        para(c, f"<font color='#B9F35D'><b>{note}</b></font>", x + 5 * mm, card_y + 14 * mm, card_w - 10 * mm, SMALL)

    round_rect(c, 18 * mm, 31 * mm, W - 36 * mm, 54 * mm, PANEL_2, CYAN)
    label(c, "WHY CLIENTS USE IT", 24 * mm, 76 * mm, LIME)
    benefits = [
        ("SAVE MONEY", "Reduce studio, crew, travel and repeat-shoot overhead."),
        ("SAVE TIME", "Skip rehearsal days, camera scheduling and retake loops."),
        ("SHORT UPDATES", "LinkedIn posts, announcements and weekly news."),
        ("TRAINING & EVENTS", "Lessons, invitations and welcome messages."),
    ]
    for i, (title, copy) in enumerate(benefits):
        col, row = i % 2, i // 2
        x = 24 * mm + col * 86 * mm
        y = 62 * mm - row * 18 * mm
        label(c, title, x, y, CYAN)
        para(c, copy, x, y - 4 * mm, 78 * mm, SMALL)
    footer(c, 2)


def draw_packages(c):
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    label(c, "PACKAGES & INCLUSIONS", 18 * mm, H - 24 * mm)
    heading(c, "Start with one. Save as you scale.", 18 * mm, H - 39 * mm, 24)
    para(c, "Choose any client-selected narration and subtitle language; one language is included per video. Suitable avatar and voice availability is confirmed before approval.", 18 * mm, H - 47 * mm, 166 * mm)

    plans = [
        ("SINGLE VIDEO", "US$39", "1 finished video", "Up to 90 seconds<br/>One-off"),
        ("MONTHLY 4", "US$140", "4 videos / month · US$35 each", "Each up to 90 seconds<br/>Use within the month"),
        ("GROWTH 8", "US$248", "8 videos · US$31 each", "Each up to 90 seconds<br/>Valid for 3 months"),
        ("PARTNER 12", "US$324", "12 videos · US$27 each", "Each up to 90 seconds<br/>Valid for 6 months"),
    ]
    card_w = (W - 36 * mm - 9 * mm) / 2
    card_h = 44 * mm
    top = H - 70 * mm
    for i, (name, price, unit, note) in enumerate(plans):
        col, row = i % 2, i // 2
        x = 18 * mm + col * (card_w + 9 * mm)
        y = top - card_h - row * (card_h + 7 * mm)
        round_rect(c, x, y, card_w, card_h, PANEL if i != 1 else colors.HexColor("#123552"), CYAN if i == 1 else LINE)
        label(c, name, x + 6 * mm, y + card_h - 9 * mm, LIME if i == 1 else CYAN)
        heading(c, price, x + 6 * mm, y + 19 * mm, 22)
        para(c, f"<b>{unit}</b><br/>{note}", x + 6 * mm, y + 14 * mm, card_w - 12 * mm, SMALL)
        c.linkURL(LINKEDIN, (x, y, x + card_w, y + card_h), relative=0)

    box_y = 53 * mm
    round_rect(c, 18 * mm, box_y, W - 36 * mm, 57 * mm, PANEL_2)
    heading(c, "Every short-form video includes", 24 * mm, box_y + 46 * mm, 15)
    items = ["Up to 90 seconds each", "Client-supplied approved script", "Basic AI grammar and clarity check", "Standard AI presenter and voice", "Branded background", "Narration + subtitles in one language", "1080p MP4 delivery", "One consolidated pre-generation review"]
    for i, item in enumerate(items):
        col, row = i % 2, i // 2
        x = 25 * mm + col * 84 * mm
        y = box_y + 35 * mm - row * 8 * mm
        c.setFillColor(LIME)
        c.circle(x, y + 1.5, 1.2 * mm, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica", 8.4)
        c.drawString(x + 4 * mm, y, item)
    link_button(c, "CONTACT ON LINKEDIN", LINKEDIN, 18 * mm, 27 * mm, 58 * mm, 13 * mm)
    para(c, "Listed video prices include a standard AI presenter. Personal AI Presenter setup using your authorised face and voice is a separate one-time service and is quoted before work begins.", 82 * mm, 39 * mm, 110 * mm, SMALL)
    footer(c, 3)


def draw_brief(c):
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    label(c, "CLIENT BRIEFING & WORKFLOW", 18 * mm, H - 24 * mm)
    heading(c, "What we need from you", 18 * mm, H - 39 * mm, 24)
    para(c, "Every material choice is validated before generation. Your written 'Approved to generate' confirmation locks the brief and prevents avoidable regeneration costs.", 18 * mm, H - 47 * mm, 166 * mm)
    brief_items = [
        ("01", "Final approved script", "Correct names, titles, dates and pronunciation notes."),
        ("02", "Audience and tone", "Who will watch, and whether delivery should be formal, warm or energetic."),
        ("03", "Brand assets", "Logo, brand colours, preferred background and mandatory visual elements."),
        ("04", "Language, avatar and voice", "Narration/subtitle language, voice, tone, timing, music and output ratio. Availability is confirmed before approval."),
        ("05", "Rights and consent", "You must own supplied assets and provide written consent for custom likeness or voice."),
        ("06", "Final approval to generate", "Review the summary, then reply 'Approved to generate' to lock the brief."),
    ]
    top = H - 68 * mm
    for i, (num, title, text) in enumerate(brief_items):
        col, row = i % 2, i // 2
        x = 18 * mm + col * 88 * mm
        y = top - row * 35 * mm
        c.setFillColor(CYAN)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(x, y, num)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 9.4)
        c.drawString(x + 10 * mm, y, title)
        para(c, text, x + 10 * mm, y - 4 * mm, 72 * mm, SMALL)

    round_rect(c, 18 * mm, 52 * mm, W - 36 * mm, 52 * mm, PANEL)
    heading(c, "Approval-gated production flow", 24 * mm, 92 * mm, 15)
    steps = ["Select package", "Submit brief", "Language, voice & brand check", "Client approval", "Generate & QA", "1080p delivery"]
    step_w = (W - 48 * mm) / 6
    for i, step in enumerate(steps):
        x = 24 * mm + i * step_w
        c.setFillColor(CYAN)
        c.circle(x + 4 * mm, 75 * mm, 4 * mm, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 7.6)
        c.drawCentredString(x + 4 * mm, 73.5 * mm, str(i + 1))
        para(c, step, x - 2 * mm, 68 * mm, step_w - 3 * mm, CENTER)
        if i < 5:
            c.setStrokeColor(LINE)
            c.line(x + 9 * mm, 75 * mm, x + step_w - 2 * mm, 75 * mm)
    para(c, "<b>Approval policy:</b> One pre-generation review is included. Validate the script, narration/subtitle language, voice, timing, format, music and visuals, then confirm 'Approved to generate'. This locks the brief. Client-requested changes after generation are charged; mismatches against the approved brief are corrected free.", 18 * mm, 46 * mm, 174 * mm, SMALL)
    link_button(c, "DISCUSS YOUR BRIEF", LINKEDIN, 18 * mm, 22 * mm, 52 * mm, 12 * mm)
    footer(c, 5)


def draw_longform(c):
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    label(c, "LONG-FORM PRODUCTION", 18 * mm, H - 24 * mm)
    heading(c, "Longer messages. Same polished finish.", 18 * mm, H - 39 * mm, 24)
    para(c, "The US$39 starter offer covers one video up to 90 seconds only. For longer programmes, choose a maximum runtime below and we will shape the production around your approved brief.", 18 * mm, H - 47 * mm, 164 * mm)

    tiers = [
        ("1 VIDEO · UP TO 3 MIN", "US$51", "about US$17/min"),
        ("1 VIDEO · UP TO 5 MIN", "US$64", "about US$13/min"),
        ("1 VIDEO · UP TO 10 MIN", "US$90", "about US$9/min"),
        ("1 VIDEO · UP TO 20 MIN", "US$115", "about US$6/min"),
        ("1 VIDEO · UP TO 30 MIN", "US$141", "about US$5/min"),
    ]
    card_w = (W - 42 * mm) / 3
    card_h = 38 * mm
    for i, (duration, price, unit) in enumerate(tiers):
        if i < 3:
            x = 18 * mm + i * (card_w + 3 * mm)
            y = H - 105 * mm
        else:
            x = 47 * mm + (i - 3) * (card_w + 5 * mm)
            y = H - 150 * mm
        featured = i == 4
        round_rect(c, x, y, card_w, card_h, colors.HexColor("#143B4D") if featured else PANEL, LIME if featured else LINE, 4 * mm)
        label(c, duration, x + 5 * mm, y + 28 * mm, LIME if featured else CYAN)
        heading(c, price, x + 5 * mm, y + 15 * mm, 17)
        para(c, unit, x + 5 * mm, y + 10 * mm, card_w - 10 * mm, SMALL)
        c.linkURL(LINKEDIN, (x, y, x + card_w, y + card_h), relative=0)

    round_rect(c, 18 * mm, 48 * mm, W - 36 * mm, 77 * mm, PANEL_2)
    heading(c, "What is included", 24 * mm, 113 * mm, 15)
    included = [
        "Approved script and content structure",
        "Professional avatar, voice and branded background",
        "Basic AI grammar and clarity check",
        "Scene assembly plus human QA for names and dates",
        "One consolidated pre-generation review",
        "Narration + subtitles in one selected language",
    ]
    for i, item in enumerate(included):
        col, row = i % 2, i // 2
        x = 25 * mm + col * 84 * mm
        y = 101 * mm - row * 10 * mm
        c.setFillColor(LIME)
        c.circle(x, y + 1.5, 1.2 * mm, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica", 7.8)
        c.drawString(x + 4 * mm, y, item)
    para(c, "For videos longer than 10 minutes, one consolidated approval covers the complete script and visual plan. Production may then be completed in sections and assembled into one final video. Client-requested changes after generation are chargeable.", 24 * mm, 70 * mm, 160 * mm, SMALL)
    link_button(c, "DISCUSS A DURATION", LINKEDIN, 18 * mm, 22 * mm, 58 * mm, 12 * mm)
    footer(c, 4)


def draw_demos(c):
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    label(c, "DEMOS & ADD-ONS", 18 * mm, H - 24 * mm)
    heading(c, "See the service in action", 18 * mm, H - 39 * mm, 24)
    para(c, "These client-supplied examples show how an approved brief can become a polished finance update with a professional virtual presenter.", 18 * mm, H - 47 * mm, 160 * mm)

    posters = [
        (
            DR_XI_POSTER,
            "Dr. Xi - One-Minute Finance Briefing",
            "Mandarin financial-news delivery with a calm executive presence.",
            SITE + "#demo-dr-xi",
        ),
        (
            CHENXI_POSTER,
            "Chenxi - Finance Presenter Sample",
            "Broadcast-style Mandarin market update with a professional virtual presenter and finance graphics.",
            SITE + "#demo-chenxi",
        ),
    ]
    card_w = (W - 43 * mm) / 2
    card_h = 69 * mm
    for i, (poster, title, description, url) in enumerate(posters):
        x = 18 * mm + i * (card_w + 7 * mm)
        y = H - 127 * mm
        round_rect(c, x, y, card_w, card_h, PANEL)
        c.drawImage(ImageReader(str(poster)), x + 3 * mm, y + 26 * mm, card_w - 6 * mm, 38 * mm, preserveAspectRatio=True, anchor="c", mask="auto")
        para(
            c,
            f"<b>{title}</b><br/><font color='#A7B8CC'>{description}</font><br/><font color='#3CE8FF'>WATCH DEMO →</font>",
            x + 5 * mm,
            y + 22 * mm,
            card_w - 10 * mm,
            BODY_WHITE,
        )
        c.linkURL(url, (x, y, x + card_w, y + card_h), relative=0)

    para(c, "<b>Demo rights note:</b> Demo media is client-supplied. Customers must hold the necessary rights and written consent for any custom likeness, voice or supplied media.", 18 * mm, 78 * mm, 174 * mm, SMALL)

    heading(c, "Optional add-ons", 18 * mm, 152 * mm, 15)
    addons = [
        ("Long-form runtime", "Up to 30 min"), ("Post-generation minor change", "From US$13"), ("Script polish", "US$19"),
        ("Full scriptwriting", "US$39+"), ("Personal AI Presenter setup", "Quoted separately"), ("Custom background", "US$26+"),
        ("Additional language version", "US$26"), ("24-hour rush", "+30%"), ("Major regeneration after approval", "From US$26"),
    ]
    for i, (name, price) in enumerate(addons):
        col, row = i % 3, i // 3
        x = 18 * mm + col * 59 * mm
        y = 126 * mm - row * 20 * mm
        round_rect(c, x, y, 54 * mm, 15 * mm, PANEL_2, LINE, 2 * mm)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawString(x + 4 * mm, y + 8.5 * mm, name)
        c.setFillColor(LIME)
        c.setFont("Helvetica-Bold", 7.4)
        c.drawString(x + 4 * mm, y + 3.5 * mm, price)

    round_rect(c, 18 * mm, 31 * mm, W - 36 * mm, 29 * mm, colors.HexColor("#123552"), CYAN)
    heading(c, "Ready to create your video?", 24 * mm, 48 * mm, 15)
    para(c, "Contact Alvin on LinkedIn to confirm a package or discuss your production brief directly.", 24 * mm, 42 * mm, 88 * mm, SMALL)
    link_button(c, "CONTACT ON LINKEDIN", LINKEDIN, W - 78 * mm, 39 * mm, 54 * mm, 12 * mm)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.8)
    c.drawRightString(W - 18 * mm, 22 * mm, PDF_LINK)
    footer(c, 6)


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    c.setTitle("AI Avatar Video Service - Pricing, Briefing & Demos")
    c.setAuthor("Alvin Liao · Safety Nexus")
    c.setSubject("Professional AI avatar video packages, client briefing requirements and demo links")
    for page in (draw_cover, draw_story, draw_packages, draw_longform, draw_brief, draw_demos):
        page(c)
        c.showPage()
    c.save()
    PUBLIC_OUTPUT.write_bytes(OUTPUT.read_bytes())
    print(OUTPUT)
    print(PUBLIC_OUTPUT)


if __name__ == "__main__":
    build()
