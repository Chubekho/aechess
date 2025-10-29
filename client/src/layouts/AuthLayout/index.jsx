import { Outlet } from "react-router";
import styles from "./AuthLayout.module.scss";

function AuthLayout() {
    return (
        <div className={styles.wrapper}>
            <Outlet/>
        </div>
    )
}

export default AuthLayout;