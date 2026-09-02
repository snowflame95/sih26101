import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import assessmentApi from "../api/assessmentApi";
import competencyApi from "../api/competencyApi";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";

const emptyForm = { title: "", description: "", competency_id: "", question_text: "", options: "", correct_answer: "", difficulty: "medium", explanation: "" };

export default function TrainerAssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setIsLoading(true);
    try {
      const [assessmentData, competencyData] = await Promise.all([assessmentApi.listManageAssessments(), competencyApi.getAllCompetencies()]);
      setAssessments(assessmentData || []);
      setCompetencies(competencyData || []);
      if (!form.competency_id && competencyData?.length) setForm((previous) => ({ ...previous, competency_id: competencyData[0].id }));
    } catch (loadError) { setError(loadError?.message || "Unable to load trainer assessments."); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const change = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const create = async (event) => {
    event.preventDefault();
    const options = form.options.split(",").map((item) => item.trim()).filter(Boolean);
    if (options.length < 2 || !options.includes(form.correct_answer.trim())) { setError("Provide at least two unique options and choose the correct answer from them."); return; }
    if (new Set(options).size !== options.length) { setError("Question options must be unique."); return; }
    setIsSaving(true); setError(""); setSuccess("");
    try {
      await assessmentApi.createAssessment({ title: form.title, description: form.description || null, questions: [{ competency_id: Number(form.competency_id), question_text: form.question_text, options, correct_answer: form.correct_answer.trim(), difficulty: form.difficulty, explanation: form.explanation || null }] });
      setForm({ ...emptyForm, competency_id: competencies[0]?.id || "" }); setSuccess("Assessment created with one question."); await load();
    } catch (saveError) { setError(saveError?.message || "Unable to create assessment."); }
    finally { setIsSaving(false); }
  };

  const toggle = async (assessment) => {
    try { const updated = await assessmentApi.updateAssessment(assessment.id, { is_active: !assessment.is_active }); setAssessments((previous) => previous.map((item) => item.id === updated.id ? updated : item)); setSuccess(updated.is_active ? "Assessment activated." : "Assessment deactivated."); }
    catch (updateError) { setError(updateError?.message || "Unable to update assessment."); }
  };

  const remove = async (assessmentId) => {
    if (!window.confirm("Delete this assessment? Assessments with learner attempts cannot be deleted.")) return;
    try { await assessmentApi.deleteAssessment(assessmentId); setAssessments((previous) => previous.filter((item) => item.id !== assessmentId)); setSuccess("Assessment deleted."); }
    catch (deleteError) { setError(deleteError?.message || "Unable to delete assessment."); }
  };

  if (isLoading) return <LoadingSpinner message="Loading trainer assessments..." />;
  return <div><h1>Assessment Authoring</h1><p><Link to="/trainer">Trainer Dashboard</Link></p>{error ? <ErrorMessage message={error} /> : null}{success ? <p style={styles.success}>{success}</p> : null}<form onSubmit={create} style={styles.form}><h2>Create assessment</h2><input name="title" placeholder="Assessment title" value={form.title} onChange={change} required style={styles.input} /><textarea name="description" placeholder="Description" value={form.description} onChange={change} style={styles.input} /><select name="competency_id" value={form.competency_id} onChange={change} required style={styles.input}>{competencies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><textarea name="question_text" placeholder="Question text" value={form.question_text} onChange={change} required style={styles.input} /><input name="options" placeholder="Options separated by commas" value={form.options} onChange={change} required style={styles.input} /><input name="correct_answer" placeholder="Correct answer" value={form.correct_answer} onChange={change} required style={styles.input} /><select name="difficulty" value={form.difficulty} onChange={change} style={styles.input}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select><textarea name="explanation" placeholder="Optional explanation" value={form.explanation} onChange={change} style={styles.input} /><button disabled={isSaving} style={styles.button}>{isSaving ? "Saving..." : "Create Assessment"}</button></form><div style={styles.list}>{assessments.map((assessment) => <article key={assessment.id} style={styles.card}><h2>{assessment.title}</h2><p>{assessment.description || "No description"}</p><p>{assessment.questions.length} question(s) • {assessment.is_active ? "Active" : "Inactive"}</p><div style={styles.row}><button type="button" onClick={() => toggle(assessment)} style={styles.secondary}>{assessment.is_active ? "Deactivate" : "Activate"}</button><button type="button" onClick={() => remove(assessment.id)} style={styles.danger}>Delete</button></div>{assessment.questions.map((question) => <div key={question.id} style={styles.question}><strong>{question.question_text}</strong><span>Correct answer: {question.correct_answer}</span><span>Options: {question.options.join(", ")}</span></div>)}</article>)}</div></div>;
}

const styles = { form: { display: "grid", gap: "0.75rem", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.25rem", margin: "1.25rem 0" }, input: { border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.7rem", font: "inherit" }, button: { border: "none", borderRadius: "8px", background: "#2563eb", color: "#fff", padding: "0.7rem 0.9rem", fontWeight: 700, cursor: "pointer" }, secondary: { border: "1px solid #94a3b8", borderRadius: "8px", background: "#fff", padding: "0.65rem 0.85rem", fontWeight: 700, cursor: "pointer" }, danger: { border: "none", borderRadius: "8px", background: "#dc2626", color: "#fff", padding: "0.65rem 0.85rem", fontWeight: 700, cursor: "pointer", marginLeft: "0.5rem" }, list: { display: "grid", gap: "1rem" }, card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.25rem" }, row: { display: "flex", gap: "0.75rem", flexWrap: "wrap" }, question: { display: "grid", gap: "0.25rem", marginTop: "1rem", borderTop: "1px solid #e2e8f0", paddingTop: "0.75rem", color: "#475569" }, success: { color: "#166534", fontWeight: 600 } };
