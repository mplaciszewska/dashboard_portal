from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate
from reportlab.lib.sequencer import Sequencer


class DocTemplate(BaseDocTemplate):
    def __init__(self, filename, doc_name, header_name):
        super().__init__(filename, pagesize=A4)
        self.doc_name = doc_name
        self.header_name = header_name
        self.leftMargin = inch * 0.3
        self.rightMargin = inch * 0.3
        self.seq = Sequencer()

    def beforePage(self):
        """Dodaje numer strony na dole."""
        page_number = str(self.canv.getPageNumber())
        self.canv.saveState()
        self.canv.setFont("regular", 10)
        page_width, page_height = self.canv._pagesize
        page_num_y = 0.5 * inch
        self.canv.drawCentredString(page_width / 2, page_num_y, page_number)
        text_width = self.canv.stringWidth(page_number, "regular", 10)
        gap = 0.15 * inch
        
        self.canv.setLineWidth(0.5)
        line_y = page_num_y + 3
        
        left_line_start = 0.5 * inch
        left_line_end = (page_width / 2) - (text_width / 2) - gap
        self.canv.line(left_line_start, line_y, left_line_end, line_y)
        
        right_line_start = (page_width / 2) + (text_width / 2) + gap
        right_line_end = page_width - 0.5 * inch
        self.canv.line(right_line_start, line_y, right_line_end, line_y)
        
        self.canv.restoreState()

    def add_header(self, canvas: Canvas, doc):
        """Dodaje nagłówek na górze strony."""
        canvas.saveState()
        canvas.setFont("bold", 11)
        page_width, page_height = A4
        top_margin = 0.5 * inch
        padding_below = 0.15 * inch
        header_y = page_height - top_margin

        canvas.drawString(x=0.5 * inch, y=header_y, text=self.doc_name)
        canvas.drawRightString(
            x=page_width - 0.5 * inch, y=header_y, text=self.header_name
        )

        line_y = header_y - padding_below
        canvas.setLineWidth(0.5)
        canvas.line(0.5 * inch, line_y, page_width - 0.5 * inch, line_y)

        canvas.restoreState()


class TemplateBuilder:
    def __init__(self, report_file_path: str):
        self.report_file_path = report_file_path
        self.doc_name = "Untitled Document"
        self.header_name = "Unknown Header"
        self._doc = None
        self.create_doc()

    def create_doc(self):
        self._doc = DocTemplate(self.report_file_path, self.doc_name, self.header_name)
        left_padding = 0.5 * inch
        right_padding = 0.5 * inch
        top_padding = 0.85 * inch
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
            
    def set_header_name(self, header_name: str):
        self.header_name = header_name
        if self._doc:
            self._doc.header_name = header_name
