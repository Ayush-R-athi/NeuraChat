import { useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { toast } from "sonner";
import "./Auth.css";

function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password || (!isLogin && !form.name)) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        const endpoint = isLogin ? "/auth/login" : "/auth/register";
        const body = isLogin
            ? { email: form.email, password: form.password }
            : { name: form.name, email: form.email, password: form.password };

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok) { toast.error(data.error); setLoading(false); return; }

            login(data.user, data.token);
            toast.success(isLogin ? "Welcome back!" : "Account created!");
        } catch (err) {
            toast.error("Something went wrong. Try again.");
        }
        setLoading(false);
    };

    return (
        <div className="authPage">
            <div className="authCard">
                <div className="authLogo">
                    <img src="src/assets/Neura.png" alt="logo" />
                    <h1>NeuraChat</h1>
                </div>
                <p className="authSubtitle">{isLogin ? "Welcome back" : "Create your account"}</p>

                <form onSubmit={handleSubmit} className="authForm">
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Full name"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email address"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                    />
                    <button type="submit" className="authBtn" disabled={loading}>
                        {loading ? "Please wait..." : isLogin ? "Log in" : "Create account"}
                    </button>
                </form>

                <p className="authSwitch">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <span onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? " Sign up" : " Log in"}
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Auth;
