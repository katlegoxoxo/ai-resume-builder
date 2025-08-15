// @ts-nocheck
// Note: You will need to install these packages:
// npm install jspdf html2canvas docx

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { ResumeData } from '../types';

export const exportToPDF = async (elementId: string, fileName: string): Promise<void> => {
  const originalElement = document.getElementById(elementId);
  if (!originalElement) {
    console.error("Resume element not found for PDF export.");
    alert("Could not find resume content to export.");
    return;
  }

  // To ensure an accurate render, we'll clone the element and render it off-screen
  // at its natural size. This avoids issues with CSS transforms (like scaling) on the live element.
  const clone = originalElement.cloneNode(true) as HTMLElement;
  
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0px';
  // The 'transform' is on a parent element, so cloning the child and appending to body
  // effectively removes the transform for the capture.

  document.body.appendChild(clone);

  try {
    // Wait for web fonts to be fully loaded before capturing, which can prevent text rendering issues.
    await document.fonts.ready;
    
    const canvas = await html2canvas(clone, {
      scale: 2, // Use a higher scale for better resolution in the PDF
      useCORS: true,
      letterRendering: true, // This can improve text rendering accuracy
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgHeight = canvasHeight * pageWidth / canvasWidth;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(`${fileName}.pdf`);
  } catch(err) {
      console.error("Failed to generate PDF:", err);
      alert("An error occurred while generating the PDF. Please try again.");
  } finally {
      // Clean up the cloned element
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
  }
};

export const exportToDOCX = async (resumeData: ResumeData, fileName: string): Promise<void> => {
    const { personalInfo, summary, workExperience, education, skills, projects } = resumeData;

    const contactDetails = [
        personalInfo.email,
        personalInfo.phone,
        personalInfo.linkedin,
        personalInfo.website,
    ].filter(Boolean); // Filters out any empty or undefined strings

    const contactChildren: TextRun[] = [];
    contactDetails.forEach((detail, index) => {
        contactChildren.push(new TextRun(detail as string));
        if (index < contactDetails.length - 1) {
            contactChildren.push(new TextRun(" | "));
        }
    });

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({ text: personalInfo.name, heading: HeadingLevel.HEADING_1, alignment: 'center' }),
                new Paragraph({
                    alignment: 'center',
                    children: contactChildren,
                }),
                new Paragraph({ text: "" }), // spacer
                new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2, border: { bottom: { color: "auto", space: 1, value: "single", size: 6 } } }),
                new Paragraph(summary),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "Work Experience", heading: HeadingLevel.HEADING_2, border: { bottom: { color: "auto", space: 1, value: "single", size: 6 } } }),
                ...workExperience.flatMap(job => [
                    new Paragraph({
                        children: [
                            new TextRun({ text: job.jobTitle, bold: true }),
                            new TextRun({ text: ` | ${job.company}, ${job.location}`, italics: true }),
                        ]
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: `${job.startDate} - ${job.isCurrent ? 'Present' : job.endDate}`, color: "888888" })]
                    }),
                    ...job.description.map(desc => new Paragraph({ text: desc, bullet: { level: 0 } })),
                    new Paragraph({ text: "" }),
                ]),
                new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_2, border: { bottom: { color: "auto", space: 1, value: "single", size: 6 } } }),
                ...education.map(edu => new Paragraph({
                    children: [
                        new TextRun({ text: `${edu.degree}, ${edu.fieldOfStudy}`, bold: true }),
                        new TextRun({ text: ` | ${edu.institution}` }),
                    ]
                })),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_2, border: { bottom: { color: "auto", space: 1, value: "single", size: 6 } } }),
                new Paragraph(skills.map(s => s.name).join(', ')),
                 new Paragraph({ text: "" }),
                new Paragraph({ text: "Projects", heading: HeadingLevel.HEADING_2, border: { bottom: { color: "auto", space: 1, value: "single", size: 6 } } }),
                ...projects.flatMap(p => [
                    new Paragraph({
                        children: [
                            new TextRun({ text: p.name, bold: true }),
                             new TextRun({ text: ` | ${p.url}` }),
                        ]
                    }),
                     new Paragraph(p.description),
                ]),
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
