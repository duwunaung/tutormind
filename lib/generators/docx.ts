import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";

type Section = {
  sectionNumber: number;
  title: string;
  duration: string;
  objectives: string[];
  description: string;
  activities: string;
  assessment: string;
};

export type LessonPlan = {
  type: "lesson" | "course";
  title: string;
  subject: string;
  gradeLevel: string;
  objectives: string[];
  materials: string[];
  notes: string;
  // Lesson fields
  duration?: string;
  lessonStructure?: {
    introduction: { duration: string; description: string };
    mainActivity: { duration: string; description: string };
    wrapUp: { duration: string; description: string };
  };
  assessment?: string[];
  homework?: string;
  // Course fields
  totalDuration?: string;
  courseOverview?: string;
  sections?: Section[];
  finalAssessment?: string;
};

export async function generateDocx(plan: LessonPlan): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  // ── Title ──
  children.push(
    new Paragraph({
      text: plan.title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Subject: ${plan.subject}   |   `, bold: true }),
        new TextRun({ text: `Grade: ${plan.gradeLevel}   |   `, bold: true }),
        new TextRun({
          text: `Duration: ${plan.type === "course" ? plan.totalDuration : plan.duration}`,
          bold: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // ── Course Overview ──
  if (plan.type === "course" && plan.courseOverview) {
    children.push(
      new Paragraph({
        text: "Course Overview",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      }),
      new Paragraph({
        text: plan.courseOverview,
        spacing: { after: 200 },
      })
    );
  }

  // ── Learning Objectives ──
  children.push(
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
    )
  );

  // ── Materials ──
  children.push(
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
    )
  );

  // ── LESSON: Lesson Structure ──
  if (plan.type === "lesson" && plan.lessonStructure) {
    children.push(
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
                children: [new Paragraph({ children: [new TextRun({ text: "Phase", bold: true })] })],
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
      })
    );
  }

  // ── LESSON: Assessment ──
  if (plan.type === "lesson" && plan.assessment) {
    children.push(
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
      )
    );
  }

  // ── LESSON: Homework ──
  if (plan.type === "lesson" && plan.homework) {
    children.push(
      new Paragraph({
        text: "Homework",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      }),
      new Paragraph({ text: plan.homework })
    );
  }

  // ── COURSE: Sections ──
  if (plan.type === "course" && plan.sections) {
    children.push(
      new Paragraph({
        text: `Course Sections (${plan.sections.length})`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      })
    );

    for (const s of plan.sections) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Section ${s.sectionNumber}: ${s.title}`,
              bold: true,
            }),
            new TextRun({ text: `  (${s.duration})`, color: "666666" }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: s.description,
          spacing: { after: 80 },
        })
      );

      if (s.activities) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Activities: ", bold: true }),
              new TextRun({ text: s.activities }),
            ],
            spacing: { after: 80 },
          })
        );
      }

      if (s.assessment) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Assessment: ", bold: true }),
              new TextRun({ text: s.assessment }),
            ],
            spacing: { after: 80 },
          })
        );
      }

      if (s.objectives && s.objectives.length > 0) {
        children.push(
          ...s.objectives.map(
            (obj) =>
              new Paragraph({
                text: `• ${obj}`,
                spacing: { after: 60 },
              })
          )
        );
      }
    }
  }

  // ── COURSE: Final Assessment ──
  if (plan.type === "course" && plan.finalAssessment) {
    children.push(
      new Paragraph({
        text: "Final Assessment",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      }),
      new Paragraph({ text: plan.finalAssessment })
    );
  }

  // ── Notes ──
  if (plan.notes) {
    children.push(
      new Paragraph({
        text: "Teacher Notes",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      }),
      new Paragraph({ text: plan.notes })
    );
  }

  // ── Build Document ──
  const doc = new Document({
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}