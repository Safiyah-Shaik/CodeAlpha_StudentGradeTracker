import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  getGetStudentSummaryQueryKey,
  getListStudentsQueryKey,
  useCreateStudent,
  useDeleteStudent,
  useGetStudentSummary,
  useListStudents,
  useUpdateStudent,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BarChart3, BookOpen, Check, ChevronDown, CircleAlert, ClipboardList, Edit3, GraduationCap, Loader2, Plus, RefreshCw, Search, ShieldCheck, Sparkles, Trash2, TrendingUp, UserRound, UsersRound, X } from 'lucide-react';
import { useLocation, Router as WouterRouter, Route, Switch } from 'wouter';

const queryClient = new QueryClient();

type StudentRecord = {
  id: number;
  name: string;
  marks: number;
  grade: string;
  createdAt: string;
};

type FormState = { name: string; marks: string };

const emptyForm: FormState = { name: '', marks: '' };

function errorMessage(error: unknown) {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'error' in error) {
    return String((error as { error?: string }).error ?? 'Something went wrong.');
  }
  return 'We could not complete that request. Try again.';
}

function formatDate(value: string) {
  if (!value) return 'Recently added';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently added';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function gradeTone(grade: string) {
  const normalized = grade.toUpperCase();
  if (normalized.startsWith('A')) return 'bg-[#d9efe4] text-[#1b6046]';
  if (normalized.startsWith('B')) return 'bg-[#e4edfa] text-[#2d5685]';
  if (normalized.startsWith('C')) return 'bg-[#f7edcd] text-[#806223]';
  return 'bg-[#f8dfdc] text-[#98423b]';
}

function AppMark() {
  return (
    <div className="flex items-center gap-3" data-testid="brand-mark">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#e4b84d] text-[#17324d] shadow-[3px_3px_0_#17324d]">
        <BookOpen size={19} strokeWidth={2.4} />
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#17324d] bg-[#8dc8b0]" />
      </div>
      <div>
        <p className="font-serif text-[19px] leading-none tracking-[-0.02em] text-[#f8f3e7]">Classmark</p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#a8b5bd]">Grade workspace</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, suffix, icon: Icon, accent, note }: {
  label: string;
  value: string | number;
  suffix?: string;
  icon: typeof UsersRound;
  accent: string;
  note: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#e5dfd3] bg-[#fffdf8] p-5 shadow-[0_5px_18px_-13px_rgba(23,50,77,.35)] transition-transform duration-300 hover:-translate-y-1" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 ${accent}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6f7d84]">{label}</p>
          <p className="mt-3 font-mono text-[29px] leading-none tracking-[-0.06em] text-[#17324d]" data-testid={`value-${label.toLowerCase().replaceAll(' ', '-')}`}>
            {value}{suffix && <span className="ml-1 text-[16px] tracking-normal text-[#6f7d84]">{suffix}</span>}
          </p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent} bg-opacity-30 text-[#17324d]`}>
          <Icon size={17} strokeWidth={2.1} />
        </div>
      </div>
      <p className="relative mt-4 text-xs text-[#879197]">{note}</p>
    </div>
  );
}

function SkeletonMetrics() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" data-testid="loading-summary">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="rounded-2xl border border-[#e5dfd3] bg-[#fffdf8] p-5" key={index}>
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton mt-4 h-8 w-16 rounded" />
          <div className="skeleton mt-4 h-3 w-24 rounded" />
        </div>
      ))}
    </div>
  );
}

function StudentFormModal({ editingStudent, onClose, onSaved }: {
  editingStudent: StudentRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const [form, setForm] = useState<FormState>(() => editingStudent
    ? { name: editingStudent.name, marks: String(editingStudent.marks) }
    : emptyForm);
  const [errors, setErrors] = useState<{ name?: string; marks?: string }>({});
  const [serverError, setServerError] = useState('');
  const isEditing = Boolean(editingStudent);
  const isPending = createStudent.isPending || updateStudent.isPending;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: { name?: string; marks?: string } = {};
    const trimmedName = form.name.trim();
    const marks = Number(form.marks);
    if (!trimmedName) nextErrors.name = 'Add the student’s name.';
    if (form.marks === '' || Number.isNaN(marks)) nextErrors.marks = 'Enter a score from 0 to 100.';
    else if (marks < 0 || marks > 100) nextErrors.marks = 'Scores must be between 0 and 100.';
    setErrors(nextErrors);
    setServerError('');
    if (Object.keys(nextErrors).length) return;

    const data = { name: trimmedName, marks };
    const options = {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getGetStudentSummaryQueryKey() });
        onSaved();
      },
      onError: (error: unknown) => setServerError(errorMessage(error)),
    };
    if (editingStudent) updateStudent.mutate({ id: editingStudent.id, data }, options);
    else createStudent.mutate({ data }, options);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-[#17324d]/45 p-0 backdrop-blur-[3px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isPending) onClose(); }}>
      <section className="reveal w-full max-w-[500px] rounded-t-[26px] border border-[#e5dfd3] bg-[#fffdf8] p-6 shadow-[0_24px_70px_-28px_rgba(23,50,77,.6)] sm:rounded-[26px]" role="dialog" aria-modal="true" aria-labelledby="student-form-title" data-testid="student-form-modal">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[#9b7928]">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f5e7bb]"><UserRound size={14} /></span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em]">{isEditing ? 'Update record' : 'New record'}</span>
            </div>
            <h2 id="student-form-title" className="font-serif text-[30px] leading-none tracking-[-0.03em] text-[#17324d]">{isEditing ? 'Refine a result' : 'Add a student'}</h2>
            <p className="mt-2 text-sm text-[#748087]">{isEditing ? 'Keep the record current for a clearer class view.' : 'Capture a result while it is still fresh.'}</p>
          </div>
          <button type="button" onClick={onClose} disabled={isPending} className="rounded-full p-2 text-[#70808a] transition-colors hover:bg-[#f1ede4] hover:text-[#17324d] disabled:opacity-50" aria-label="Close form" data-testid="button-close-form">
            <X size={19} />
          </button>
        </div>
        <form className="mt-7 space-y-5" onSubmit={submit} noValidate>
          <label className="block">
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#53656e]">Student name</span>
            <input autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={`h-12 w-full rounded-xl border bg-[#faf7f0] px-4 text-[15px] text-[#17324d] transition-colors placeholder:text-[#a8adb0] focus:border-[#17324d] ${errors.name ? 'border-[#c85d52]' : 'border-[#dfd8ca]'}`} placeholder="e.g. Maya Chen" data-testid="input-student-name" />
            {errors.name && <span className="mt-1.5 flex items-center gap-1 text-xs text-[#a3433a]" data-testid="error-student-name"><CircleAlert size={12} />{errors.name}</span>}
          </label>
          <label className="block">
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#53656e]">Marks <span className="font-normal normal-case tracking-normal text-[#899399]">/ 100</span></span>
            <input type="number" min="0" max="100" step="1" value={form.marks} onChange={(event) => setForm({ ...form, marks: event.target.value })} className={`h-12 w-full rounded-xl border bg-[#faf7f0] px-4 font-mono text-[15px] text-[#17324d] transition-colors placeholder:text-[#a8adb0] focus:border-[#17324d] ${errors.marks ? 'border-[#c85d52]' : 'border-[#dfd8ca]'}`} placeholder="0 — 100" data-testid="input-student-marks" />
            {errors.marks && <span className="mt-1.5 flex items-center gap-1 text-xs text-[#a3433a]" data-testid="error-student-marks"><CircleAlert size={12} />{errors.marks}</span>}
          </label>
          {serverError && <div className="rounded-xl border border-[#efd0cc] bg-[#fcf0ee] px-3 py-2.5 text-sm text-[#9f443b]" data-testid="error-form-submit">{serverError}</div>}
          <div className="flex gap-3 border-t border-[#ece5d9] pt-5">
            <button type="button" onClick={onClose} disabled={isPending} className="h-11 flex-1 rounded-xl border border-[#dcd5c8] text-sm font-semibold text-[#53656e] transition-colors hover:bg-[#f3efe7] disabled:opacity-50" data-testid="button-cancel-form">Cancel</button>
            <button type="submit" disabled={isPending} className="flex h-11 flex-[1.5] items-center justify-center gap-2 rounded-xl bg-[#17324d] text-sm font-semibold text-[#f8f3e7] transition-transform hover:-translate-y-0.5 hover:bg-[#224864] disabled:cursor-not-allowed disabled:opacity-60" data-testid="button-save-student">
              {isPending ? <><Loader2 size={16} className="animate-spin" />Saving record</> : <>{isEditing ? 'Save changes' : 'Add student'}<Check size={16} /></>}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DeleteModal({ student, onClose, onDeleted }: { student: StudentRecord; onClose: () => void; onDeleted: () => void }) {
  const deleteStudent = useDeleteStudent();
  const [serverError, setServerError] = useState('');
  const confirmDelete = () => {
    setServerError('');
    deleteStudent.mutate({ id: student.id }, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getGetStudentSummaryQueryKey() });
        onDeleted();
      },
      onError: (error: unknown) => setServerError(errorMessage(error)),
    });
  };
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-[#17324d]/45 p-0 backdrop-blur-[3px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleteStudent.isPending) onClose(); }}>
      <section className="reveal w-full max-w-[420px] rounded-t-[26px] bg-[#fffdf8] p-6 shadow-[0_24px_70px_-28px_rgba(23,50,77,.6)] sm:rounded-[26px]" role="dialog" aria-modal="true" aria-labelledby="delete-title" data-testid="delete-student-modal">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8dfdc] text-[#a3433a]"><Trash2 size={19} /></div>
        <h2 id="delete-title" className="mt-5 font-serif text-[28px] leading-none tracking-[-0.03em] text-[#17324d]">Remove this record?</h2>
        <p className="mt-3 text-sm leading-6 text-[#718088]">This will permanently remove <strong className="font-semibold text-[#17324d]">{student.name}</strong> and its result from the class view.</p>
        {serverError && <p className="mt-3 rounded-lg bg-[#fcf0ee] p-2.5 text-xs text-[#a3433a]" data-testid="error-delete-student">{serverError}</p>}
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} disabled={deleteStudent.isPending} className="h-11 flex-1 rounded-xl border border-[#dcd5c8] text-sm font-semibold text-[#53656e] hover:bg-[#f3efe7] disabled:opacity-50" data-testid="button-cancel-delete">Keep record</button>
          <button type="button" onClick={confirmDelete} disabled={deleteStudent.isPending} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#a3433a] text-sm font-semibold text-[#fff8f0] hover:bg-[#8f3730] disabled:opacity-60" data-testid="button-confirm-delete">{deleteStudent.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={15} />}Remove</button>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-20 text-center" data-testid="empty-students">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#f4e5b9] text-[#9b7928]">
        <ClipboardList size={31} strokeWidth={1.6} />
        <span className="absolute -right-2 top-1 h-4 w-4 rounded-full border-4 border-[#fffdf8] bg-[#8dc8b0]" />
      </div>
      <h3 className="mt-6 font-serif text-[27px] tracking-[-0.03em] text-[#17324d]">Your class starts here</h3>
      <p className="mt-2 max-w-[330px] text-sm leading-6 text-[#7c888e]">Add the first student result and Classmark will keep the big picture close at hand.</p>
      <button type="button" onClick={onAdd} className="mt-6 flex h-11 items-center gap-2 rounded-xl bg-[#17324d] px-5 text-sm font-semibold text-[#f8f3e7] transition-transform hover:-translate-y-0.5" data-testid="button-add-first-student"><Plus size={16} />Add first student</button>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-[#eee8de]" data-testid="loading-students">
      {Array.from({ length: 4 }).map((_, index) => <div className="flex items-center gap-4 px-5 py-5" key={index}><div className="skeleton h-10 w-10 rounded-full" /><div className="flex-1"><div className="skeleton h-4 w-32 rounded" /><div className="skeleton mt-2 h-3 w-20 rounded" /></div><div className="skeleton h-6 w-14 rounded" /><div className="skeleton hidden h-8 w-16 rounded sm:block" /></div>)}
    </div>
  );
}

function Home() {
  const [modal, setModal] = useState<'add' | StudentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentRecord | null>(null);
  const [search, setSearch] = useState('');
  const [sortDescending, setSortDescending] = useState(true);
  const studentsQuery = useListStudents();
  const summaryQuery = useGetStudentSummary();
  const students = (studentsQuery.data ?? []) as StudentRecord[];
  const summary = summaryQuery.data;
  const filteredStudents = useMemo(() => students
    .filter((student) => student.name.toLowerCase().includes(search.toLowerCase().trim()))
    .sort((a, b) => sortDescending ? b.marks - a.marks : a.marks - b.marks), [search, sortDescending, students]);

  const openAdd = () => setModal('add');
  const closeForm = () => setModal(null);
  const openEdit = (student: StudentRecord) => setModal(student);

  return (
    <div className="grain app-shell flex min-h-[100dvh] text-[#17324d]">
      <aside className="hidden min-h-[100dvh] w-[238px] flex-col bg-[#17324d] px-5 py-7 lg:flex">
        <AppMark />
        <div className="mt-16">
          <p className="px-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[#8e9da6]">Workspace</p>
          <nav className="mt-3 space-y-1" aria-label="Main navigation">
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex w-full items-center gap-3 rounded-xl bg-[#2a4a62] px-3 py-3 text-left text-sm font-semibold text-[#fbf7ec]" data-testid="nav-overview"><BarChart3 size={17} className="text-[#e4b84d]" />Overview<span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#8dc8b0]" /></button>
            <button type="button" onClick={() => document.getElementById('student-list-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-[#aab8bf] transition-colors hover:bg-[#23445d] hover:text-[#fbf7ec]" data-testid="nav-students"><UsersRound size={17} />Students</button>
          </nav>
        </div>
        <div className="mt-auto rounded-2xl border border-[#37556a] bg-[#1e3b52] p-4">
          <div className="flex items-center gap-2 text-[#e4b84d]"><Sparkles size={14} /><span className="font-mono text-[9px] uppercase tracking-[0.13em]">A small ritual</span></div>
          <p className="mt-3 text-xs leading-5 text-[#c3ced1]">Clear records make calmer decisions. Keep going, one result at a time.</p>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-[#e4ded2] px-5 py-5 sm:px-8 lg:hidden">
          <AppMark />
          <button type="button" onClick={openAdd} className="flex h-10 items-center gap-2 rounded-xl bg-[#17324d] px-3.5 text-sm font-semibold text-[#f8f3e7]" data-testid="button-add-student-mobile"><Plus size={16} />Add</button>
        </header>
        <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 xl:px-12">
          <div className="reveal flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#9b7928]" data-testid="text-breadcrumb"><span className="h-1.5 w-1.5 rounded-full bg-[#8dc8b0]" />Term 01 <span className="text-[#c6bfae]">/</span> Overview</p>
              <h1 className="mt-4 font-serif text-[clamp(2.5rem,5vw,4.4rem)] leading-[0.95] tracking-[-0.055em] text-[#17324d]" data-testid="text-page-title">Know your class.<br /><em className="font-normal text-[#5f8d7a]">Guide their next step.</em></h1>
              <p className="mt-5 max-w-[490px] text-[15px] leading-6 text-[#718088]">A focused view of progress, ready when you are. Keep every result in one clear place.</p>
            </div>
            <button type="button" onClick={openAdd} className="hidden h-12 items-center justify-center gap-2 rounded-xl bg-[#17324d] px-5 text-sm font-semibold text-[#f8f3e7] shadow-[0_6px_15px_-8px_#17324d] transition-transform hover:-translate-y-0.5 md:flex" data-testid="button-add-student"><Plus size={17} />Add student</button>
          </div>

          <div className="mt-10">
            {summaryQuery.isLoading ? <SkeletonMetrics /> : summaryQuery.isError ? (
              <div className="flex items-center justify-between rounded-2xl border border-[#efd0cc] bg-[#fcf0ee] px-4 py-3 text-sm text-[#9f443b]" data-testid="error-summary"><span className="flex items-center gap-2"><CircleAlert size={16} />Summary unavailable right now.</span><button type="button" onClick={() => void summaryQuery.refetch()} className="font-semibold underline" data-testid="button-retry-summary">Retry</button></div>
            ) : summary ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <MetricCard label="Students" value={summary.totalStudents} icon={UsersRound} accent="bg-[#d7e8f5]" note="on your class list" />
                <MetricCard label="Average score" value={Number(summary.averageScore).toFixed(1)} suffix="%" icon={TrendingUp} accent="bg-[#d9efe4]" note="across all results" />
                <MetricCard label="Highest score" value={summary.highestScore} suffix="%" icon={Sparkles} accent="bg-[#f5e7bb]" note="a new benchmark" />
                <MetricCard label="Lowest score" value={summary.lowestScore} suffix="%" icon={BarChart3} accent="bg-[#f8dfdc]" note="room to support" />
                <MetricCard label="Passing" value={summary.passingStudents} icon={ShieldCheck} accent="bg-[#d9efe4]" note="meeting the mark" />
                <MetricCard label="Pass rate" value={Number(summary.passRate).toFixed(1)} suffix="%" icon={Check} accent="bg-[#e4edfa]" note="class confidence" />
              </div>
            ) : null}
          </div>

          <section className="reveal mt-10 overflow-hidden rounded-[22px] border border-[#e4ded2] bg-[#fffdf8] shadow-[0_10px_35px_-25px_rgba(23,50,77,.45)]" style={{ animationDelay: '80ms' }} aria-labelledby="student-list-title">
            <div className="flex flex-col gap-4 border-b border-[#eee8de] px-5 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 id="student-list-title" className="font-serif text-[25px] tracking-[-0.03em] text-[#17324d]">Student records</h2>
                  <span className="rounded-full bg-[#f3efe6] px-2.5 py-1 font-mono text-[10px] text-[#718088]" data-testid="text-student-count">{students.length}</span>
                </div>
                <p className="mt-1 text-xs text-[#899399]">Most recent marks, all in one view.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative block">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#899399]" />
                  <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a student" className="h-10 w-full rounded-xl border border-[#e1dace] bg-[#faf7f0] pl-9 pr-3 text-sm text-[#17324d] placeholder:text-[#9da5a7] focus:border-[#17324d] sm:w-[190px]" aria-label="Search students" data-testid="input-search-students" />
                </label>
                <button type="button" onClick={() => setSortDescending(!sortDescending)} className="flex h-10 items-center justify-between gap-3 rounded-xl border border-[#e1dace] bg-[#faf7f0] px-3 text-xs font-semibold text-[#53656e] hover:bg-[#f3efe7]" data-testid="button-sort-students">Score <ChevronDown size={14} className={`transition-transform ${sortDescending ? '' : 'rotate-180'}`} /></button>
              </div>
            </div>
            {studentsQuery.isLoading ? <TableSkeleton /> : studentsQuery.isError ? (
              <div className="flex flex-col items-center justify-center px-5 py-20 text-center" data-testid="error-students"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8dfdc] text-[#a3433a]"><CircleAlert size={22} /></div><h3 className="mt-4 font-serif text-xl text-[#17324d]">Couldn’t load the class list</h3><p className="mt-2 max-w-[320px] text-sm text-[#7c888e]">The records are taking a moment to arrive.</p><button type="button" onClick={() => void studentsQuery.refetch()} className="mt-5 flex items-center gap-2 rounded-xl bg-[#17324d] px-4 py-2.5 text-sm font-semibold text-[#f8f3e7]" data-testid="button-retry-students"><RefreshCw size={14} />Try again</button></div>
            ) : students.length === 0 ? <EmptyState onAdd={openAdd} /> : filteredStudents.length === 0 ? (
              <div className="px-5 py-16 text-center" data-testid="empty-search"><Search size={22} className="mx-auto text-[#aab1b3]" /><p className="mt-3 font-serif text-xl text-[#17324d]">No matching students</p><p className="mt-1 text-sm text-[#7c888e]">Try a different name or clear the search.</p><button type="button" onClick={() => setSearch('')} className="mt-4 text-sm font-semibold text-[#5f8d7a] underline" data-testid="button-clear-search">Clear search</button></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[610px] border-collapse text-left">
                  <thead><tr className="border-b border-[#eee8de] text-[10px] font-bold uppercase tracking-[0.13em] text-[#8a969a]"><th className="px-5 py-3.5 font-semibold sm:px-6">Student</th><th className="px-4 py-3.5 font-semibold">Marks</th><th className="px-4 py-3.5 font-semibold">Grade</th><th className="px-4 py-3.5 font-semibold">Added</th><th className="px-5 py-3.5 text-right font-semibold sm:px-6">Actions</th></tr></thead>
                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr key={student.id} className="group border-b border-[#f0ebe3] transition-colors last:border-0 hover:bg-[#fbf8f1]" data-testid={`row-student-${student.id}`} style={{ animationDelay: `${index * 35}ms` }}>
                        <td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e3edf3] font-serif text-[16px] text-[#315c76]" data-testid={`avatar-student-${student.id}`}>{student.name.charAt(0).toUpperCase()}</div><div><p className="font-semibold text-[#29445a]" data-testid={`text-student-name-${student.id}`}>{student.name}</p><p className="mt-0.5 font-mono text-[10px] text-[#9aa2a3]">ID {String(student.id).padStart(3, '0')}</p></div></div></td>
                        <td className="px-4 py-4"><span className="font-mono text-[15px] font-medium text-[#29445a]" data-testid={`text-student-marks-${student.id}`}>{student.marks}<span className="ml-0.5 text-[11px] text-[#9aa2a3]">/100</span></span></td>
                        <td className="px-4 py-4"><span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${gradeTone(student.grade)}`} data-testid={`status-student-grade-${student.id}`}>{student.grade}</span></td>
                        <td className="px-4 py-4 text-xs text-[#849096]" data-testid={`text-student-created-${student.id}`}>{formatDate(student.createdAt)}</td>
                        <td className="px-5 py-4 text-right sm:px-6"><div className="flex justify-end gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"><button type="button" onClick={() => openEdit(student)} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#536e78] hover:bg-[#e8f0ec] hover:text-[#244f43]" data-testid={`button-edit-student-${student.id}`}><Edit3 size={13} />Edit</button><button type="button" onClick={() => setDeleteTarget(student)} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#9b5a52] hover:bg-[#f9e6e2]" data-testid={`button-delete-student-${student.id}`}><Trash2 size={13} />Remove</button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {students.length > 0 && <div className="flex items-center justify-between border-t border-[#eee8de] bg-[#fcfaf5] px-5 py-3.5 text-[11px] text-[#899399] sm:px-6"><span data-testid="text-showing-students">Showing {filteredStudents.length} of {students.length} records</span><span className="hidden items-center gap-1.5 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#8dc8b0]" />Synced just now</span></div>}
          </section>
          <footer className="mt-8 flex flex-col justify-between gap-2 pb-3 text-[10px] uppercase tracking-[0.13em] text-[#a3aaa9] sm:flex-row"><span>Classmark · Focused progress tracking</span><span className="font-mono">Built for better next steps</span></footer>
        </div>
      </main>
      {modal && <StudentFormModal editingStudent={modal === 'add' ? null : modal} onClose={closeForm} onSaved={closeForm} />}
      {deleteTarget && <DeleteModal student={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={() => setDeleteTarget(null)} />}
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={() => <div className="flex min-h-[100dvh] items-center justify-center bg-[#f8f7f2] px-6 text-center"><div><h1 className="font-serif text-4xl text-[#17324d]">Page not found</h1><p className="mt-2 text-sm text-[#718088]">Return to the overview to continue.</p></div></div>} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
