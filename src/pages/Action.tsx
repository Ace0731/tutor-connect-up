import { useEffect, useState } from "react";
import { getAuth, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";

export default function Action() {
    const [mode, setMode] = useState("");
    const [oobCode, setOobCode] = useState("");
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [status, setStatus] = useState("verifying");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get("mode");
        const code = params.get("oobCode");

        if (!mode || !code) return setStatus("invalid");

        setMode(mode);
        setOobCode(code);

        const auth = getAuth();

        if (mode === "resetPassword") {
            verifyPasswordResetCode(auth, code)
                .then((email) => {
                    setEmail(email);
                    setStatus("ready");
                })
                .catch(() => setStatus("invalid"));
        } else {
            setStatus("unsupported");
        }
    }, []);

    const handleReset = async () => {
        const auth = getAuth();
        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setStatus("success");
            setTimeout(() => {
                window.location.href = "/login"; // or home if no login
            }, 3000);
        } catch {
            setStatus("error");
        }
    };

    if (status === "verifying") return <p className="text-center mt-10">🔄 Verifying reset link...</p>;
    if (status === "invalid") return <p className="text-center mt-10 text-red-500">❌ Invalid or expired link.</p>;
    if (status === "unsupported") return <p className="text-center mt-10 text-yellow-500">⚠️ This action type is not supported.</p>;
    if (status === "success") return <p className="text-center mt-10 text-green-600">✅ Password reset successfully! Redirecting...</p>;

    return (
        <div className="max-w-md mx-auto mt-16 p-6 bg-white border rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">
                Reset Password
            </h2>
            <p className="text-sm text-center text-gray-600 mb-6">
                for <span className="font-medium">{email}</span>
            </p>

            <div className="relative mb-4">
                <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    className="w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>

            <button
                onClick={handleReset}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
                Reset Password
            </button>

            {status === "error" && (
                <p className="text-red-500 text-sm mt-3 text-center">❌ Something went wrong. Try again.</p>
            )}
        </div>
    );
}
