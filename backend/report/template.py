from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph
from reportlab.lib.sequencer import Sequencer


class DocTemplate(BaseDocTemplate):
    def __init__(self, filename, doc_name):
        super().__init__(filename, pagesize=A4)
        self.doc_name = doc_name
        self.leftMargin = inch * 0.3
        self.rightMargin = inch * 0.3
        self.seq = Sequencer()

    def beforePage(self):
        """Dodaje numer strony na dole."""
        page_number = str(self.canv.getPageNumber())
        self.canv.saveState()
        self.canv.setFont("regular", 12)
        page_width, page_height = self.canv._pagesize
        self.canv.drawCentredString(page_width / 2, 0.5 * inch, page_number)
        self.canv.restoreState()

    def add_header(self, canvas: Canvas, doc):
        """Dodaje nagłówek na górze strony."""
        canvas.saveState()
        canvas.setFont("bold", 11)
        page_width, page_height = A4
        canvas.drawString(x=0.5 * inch, y=page_height - 0.5 * inch, text=self.doc_name)
        canvas.drawRightString(
            x=page_width - 0.5 * inch, y=page_height - 0.5 * inch, text="Dashboard Portal"
        )
        canvas.restoreState()


class TemplateBuilder:
    def __init__(self, report_file_path: str):
        self.report_file_path = report_file_path
        self.doc_name = "Untitled Document"
        self._doc = None
        self.create_doc()

    def create_doc(self):
        self._doc = DocTemplate(self.report_file_path, self.doc_name)
        left_padding = 0.5 * inch
        right_padding = 0.5 * inch
        top_padding = 0.7 * inch
        bottom_padding = 0.7 * inch

        frame = Frame(
            left_padding,
            bottom_padding,
            A4[0] - (left_padding + right_padding),
            A4[1] - (top_padding + bottom_padding),
            id="A4_Frame"
        )
        template = PageTemplate(
            id="A4_Template",
            frames=frame,
            onPage=self._doc.add_header,
            pagesize=A4
        )
        self._doc.addPageTemplates([template])

    @property
    def doc(self) -> BaseDocTemplate:
        return self._doc

    def set_doc_name(self, doc_name: str):
        self.doc_name = doc_name
        if self._doc:
            self._doc.doc_name = doc_name
