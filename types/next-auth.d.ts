interface Session {
  user: {
    id?: string;
    subject?: string;
    gradeLevel?: string;
  } & DefaultSession["user"];
}

interface JWT {
  id?: string;
  subject?: string;
  gradeLevel?: string;
}