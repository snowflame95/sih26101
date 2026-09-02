export default function EmptyState({ title, description }) {
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>{title}</h3>
      <p style={styles.description}>{description}</p>
    </div>
  );
}

const styles = {
  container: {
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "1.5rem",
    textAlign: "center",
    color: "#475569",
  },
  title: {
    margin: "0 0 0.5rem",
    color: "#0f172a",
  },
  description: {
    margin: 0,
  },
};
