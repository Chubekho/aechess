import styles from "./AnalysisSettings.module.scss";

function AnalysisSettings({ depth, setDepth, multiPV, setMultiPV }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.control}>
        <label>Số dòng (Lines): <strong>{multiPV}</strong></label>
        <input 
          type="range" 
          min="1" max="5" 
          value={multiPV} 
          onChange={(e) => setMultiPV(Number(e.target.value))} 
        />
      </div>
      
      <div className={styles.control}>
        <label>Độ sâu (Depth): <strong>{depth}</strong></label>
        <input 
          type="range" 
          min="10" max="25" 
          value={depth} 
          onChange={(e) => setDepth(Number(e.target.value))} 
        />
      </div>
    </div>
  );
}
export default AnalysisSettings;