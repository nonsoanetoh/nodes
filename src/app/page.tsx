import Canvas from "./components/canvas";
import SettingsPane from "./components/settings-pane";
import Timeline from "./components/timeline-pane";
import Header from "./components/header";
import { ProjectProvider } from "./context/ProjectContext";
import styles from "./styles/page.module.css";

export default function Home() {
  return (
    <ProjectProvider>
      <Header />
      <div className={styles.page}>
        <main className={styles.container}>
          <section className={styles.grid}>
            <SettingsPane />
            <Canvas />
            <Timeline />
          </section>
        </main>
      </div>
    </ProjectProvider>
  );
}
