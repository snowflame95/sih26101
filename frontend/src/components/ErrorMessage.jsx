export default function ErrorMessage({ message }) {
  return (
    <div style={styles.container}>
      <strong>Something went wrong</strong>
      <p style={styles.message}>{message || "Unable to load the requested data."}</p>
    </div>
  );
}

const styles = {
  container: {
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    padding: "1rem",
  },
  message: {
    margin: "0.5rem 0 0",
  },
};
