import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import competencyApi from "../api/competencyApi";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import learningApi from "../api/learningApi";

const initialForm = { competency_id: "", title: "", description: "", difficulty: "beginner", estimated_hours: 1, module_order: 1 };

export default function TrainerModulesPage() {
  const [modules, setModules] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [resources, setResources] = useState([]);
  const [resource, setResource] = useState({ title: "", description: "", resource_type: "article", resource_url: "", resource_order: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      const [moduleData, competencyData] = await Promise.all([learningApi.listModules(), competencyApi.getAllCompetencies()]);
      setModules(moduleData || []); setCompetencies(competencyData || []);
      if (!form.competency_id && competencyData?.length) setForm((previous) => ({ ...previous, competency_id: competencyData[0].id }));
    } catch (loadError) { setError(loadError?.message || "Unable to load trainer modules."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (selectedId) learningApi.listResources(selectedId).then(setResources).catch((loadError) => setError(loadError?.message || "Unable to load resources.")); }, [selectedId]);

  const saveModule = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    const payload = { ...form, competency_id: Number(form.competency_id), estimated_hours: Number(form.estimated_hours), module_order: Number(form.module_order) };
    try { if (editingId) await learningApi.updateModule(editingId, payload); else await learningApi.createModule(payload); setForm({ ...initialForm, competency_id: competencies[0]?.id || "" }); setEditingId(null); setSuccess(editingId ? "Module updated." : "Module created."); await load(); }
    catch (saveError) { setError(saveError?.message || "Unable to save module."); }
    finally { setSaving(false); }
  };
  const removeModule = async (id) => { if (!window.confirm("Delete this module? Modules with learner progress cannot be deleted.")) return; try { await learningApi.deleteModule(id); setSuccess("Module deleted."); await load(); } catch (deleteError) { setError(deleteError?.message || "Unable to delete module."); } };
  const saveResource = async (event) => { event.preventDefault(); setSaving(true); setError(""); try { const saved = await learningApi.createResource(selectedId, { ...resource, resource_order: Number(resource.resource_order) }); setResources((previous) => [...previous, saved]); setResource({ title: "", description: "", resource_type: "article", resource_url: "", resource_order: 1 }); setSuccess("Resource created."); } catch (saveError) { setError(saveError?.message || "Unable to create resource."); } finally { setSaving(false); } };
  const removeResource = async (id) => { if (!window.confirm("Delete this resource?")) return; try { await learningApi.deleteResource(id); setResources((previous) => previous.filter((item) => item.id !== id)); setSuccess("Resource deleted."); } catch (deleteError) { setError(deleteError?.message || "Unable to delete resource."); } };

  if (loading) return <LoadingSpinner message="Loading trainer modules..." />;
  return <div><h1>Learning Content</h1><p><Link to="/trainer">Trainer Dashboard</Link></p>{error && <ErrorMessage message={error} />}{success && <p style={styles.success}>{success}</p>}<form onSubmit={saveModule} style={styles.form}><h2>{editingId ? "Edit module" : "Create module"}</h2><select name="competency_id" value={form.competency_id} onChange={(event) => setForm((previous) => ({ ...previous, competency_id: event.target.value }))} required style={styles.input}>{competencies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input name="title" placeholder="Module title" value={form.title} onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))} required style={styles.input} /><textarea name="description" placeholder="Description" value={form.description} onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))} style={styles.input} /><div style={styles.row}><select name="difficulty" value={form.difficulty} onChange={(event) => setForm((previous) => ({ ...previous, difficulty: event.target.value }))} style={styles.input}><option>beginner</option><option>intermediate</option><option>advanced</option></select><input name="estimated_hours" type="number" min="1" value={form.estimated_hours} onChange={(event) => setForm((previous) => ({ ...previous, estimated_hours: event.target.value }))} style={styles.input} /><input name="module_order" type="number" min="1" value={form.module_order} onChange={(event) => setForm((previous) => ({ ...previous, module_order: event.target.value }))} style={styles.input} /></div><button disabled={saving} style={styles.button}>{editingId ? "Update Module" : "Create Module"}</button></form><div style={styles.list}>{modules.map((module) => <article key={module.id} style={styles.card}><h2>{module.title}</h2><p>{module.description || "No description"}</p><p>Competency {module.competency_id} • {module.difficulty} • {module.estimated_hours} hours</p><button type="button" onClick={() => { setEditingId(module.id); setForm({ competency_id: module.competency_id, title: module.title, description: module.description || "", difficulty: module.difficulty, estimated_hours: module.estimated_hours, module_order: module.module_order }); }} style={styles.secondary}>Edit</button><button type="button" onClick={() => setSelectedId(module.id)} style={styles.secondary}>Resources</button><button type="button" onClick={() => removeModule(module.id)} style={styles.danger}>Delete</button>{selectedId === module.id && <form onSubmit={saveResource} style={styles.resourceForm}><h3>Resources</h3><input placeholder="Resource title" value={resource.title} onChange={(event) => setResource((previous) => ({ ...previous, title: event.target.value }))} required style={styles.input} /><input type="url" placeholder="https://..." value={resource.resource_url} onChange={(event) => setResource((previous) => ({ ...previous, resource_url: event.target.value }))} required style={styles.input} /><select value={resource.resource_type} onChange={(event) => setResource((previous) => ({ ...previous, resource_type: event.target.value }))} style={styles.input}><option value="article">Article</option><option value="video">Video</option><option value="document">Document</option><option value="external_link">External link</option></select><button disabled={saving} style={styles.button}>Add Resource</button>{resources.map((item) => <div key={item.id} style={styles.resource}><strong>{item.title}</strong><a href={item.resource_url} target="_blank" rel="noreferrer">Open resource</a><button type="button" onClick={() => removeResource(item.id)} style={styles.danger}>Delete</button></div>)}</form>}</article>)}</div></div>;
}

const styles = { form: { display: "grid", gap: "0.75rem", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.25rem", margin: "1.25rem 0" }, input: { border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.7rem", font: "inherit", minWidth: 0 }, row: { display: "flex", gap: "0.75rem", flexWrap: "wrap" }, button: { border: "none", borderRadius: "8px", background: "#2563eb", color: "#fff", padding: "0.7rem 0.9rem", fontWeight: 700 }, secondary: { border: "1px solid #94a3b8", borderRadius: "8px", background: "#fff", padding: "0.65rem 0.85rem", fontWeight: 700, marginRight: "0.5rem" }, danger: { border: "none", borderRadius: "8px", background: "#dc2626", color: "#fff", padding: "0.65rem 0.85rem", fontWeight: 700, marginLeft: "0.5rem" }, list: { display: "grid", gap: "1rem" }, card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.25rem" }, resourceForm: { display: "grid", gap: "0.65rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }, resource: { display: "grid", gap: "0.3rem", padding: "0.75rem", border: "1px solid #e2e8f0", borderRadius: "8px" }, success: { color: "#166534", fontWeight: 600 } };
