export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.spinner} />
      <p style={styles.message}>{message}</p>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    padding: "2rem",
    color: "#475569",
  },
  spinner: {
    width: "2rem",
    height: "2rem",
    border: "3px solid #cbd5e1",
    borderTop: "3px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  message: {
    margin: 0,
  },
};
