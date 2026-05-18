import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from "docx";

type LessonPlan = {
  title: string;
  subject: string;
  gradeLevel: string;
  duration: string;
  objectives: string[];
  materials: string[];
  lessonStructure: {
    introduction: { duration: string; description: string };
    mainActivity: { duration: string; description: string };
    wrapUp: { duration: string; description: string };
  };
  assessment: string[];
  homework: string;
  notes: string;
};

export async function generateDocx(plan: LessonPlan): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          // Title
          new Paragraph({
            text: plan.title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),

          // Meta info
          new Paragraph({
            children: [
              new TextRun({ text: `Subject: ${plan.subject}   |   `, bold: true }),
              new TextRun({ text: `Grade: ${plan.gradeLevel}   |   `, bold: true }),
              new TextRun({ text: `Duration: ${plan.duration}`, bold: true }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Learning Objectives
          new Paragraph({
            text: "Learning Objectives",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          }),
          ...plan.objectives.map(
            (obj) =>
              new Paragraph({
                text: `• ${obj}`,
                spacing: { after: 100 },
              })
          ),

          // Materials
          new Paragraph({
            text: "Materials Needed",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          }),
          ...plan.materials.map(
            (mat) =>
              new Paragraph({
                text: `• ${mat}`,
                spacing: { after: 100 },
              })
          ),

          // Lesson Structure
          new Paragraph({
            text: "Lesson Structure",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "Phase", children: [new TextRun({ text: "Phase", bold: true })] })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Duration", bold: true })] })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true })] })],
                    width: { size: 60, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Introduction" })] }),
                  new TableCell({ children: [new Paragraph({ text: plan.lessonStructure.introduction.duration })] }),
                  new TableCell({ children: [new Paragraph({ text: plan.lessonStructure.introduction.description })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Main Activity" })] }),
                  new TableCell({ children: [new Paragraph({ text: plan.lessonStructure.mainActivity.duration })] }),
                  new TableCell({ children: [new Paragraph({ text: plan.lessonStructure.mainActivity.description })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Wrap Up" })] }),
                  new TableCell({ children: [new Paragraph({ text: plan.lessonStructure.wrapUp.duration })] }),
                  new TableCell({ children: [new Paragraph({ text: plan.lessonStructure.wrapUp.description })] }),
                ],
              }),
            ],
          }),

          // Assessment
          new Paragraph({
            text: "Assessment Ideas",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          }),
          ...plan.assessment.map(
            (item) =>
              new Paragraph({
                text: `✓ ${item}`,
                spacing: { after: 100 },
              })
          ),

          // Homework
          new Paragraph({
            text: "Homework",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({ text: plan.homework }),

          // Notes
          ...(plan.notes
            ? [
                new Paragraph({
                  text: "Teacher Notes",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 300, after: 150 },
                }),
                new Paragraph({ text: plan.notes }),
              ]
            : []),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}