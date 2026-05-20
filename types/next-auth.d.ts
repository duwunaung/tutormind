interface Session {
  user: {
    id?: string;
    subject?: string;
    gradeLevel?: string;
    role?: string;
    disabled?: boolean;
  } & DefaultSession["user"];
}

interface JWT {
  id?: string;
  subject?: string;
  gradeLevel?: string;
  role?: string;
  disabled?: boolean;
}