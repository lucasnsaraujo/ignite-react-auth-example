import { FormEvent, useContext, useState } from "react";
import styles from "./Home.module.scss";
import { AuthContext } from "../../contexts/AuthContext";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { isAuthenticated, signIn } = useContext(AuthContext);

  async function handleSubmit(e: FormEvent) {
    const data = { email, password };
    e.preventDefault();
    await signIn(data);
  }
  return (
    <>
      <form className={styles.container} onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Enviar</button>
      </form>
    </>
  );
}
