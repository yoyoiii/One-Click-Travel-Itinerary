import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError("请填写所有必填项");
      return;
    }
    if (!validateEmail(email)) {
      setError("请输入有效的邮箱地址");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    if (password.length < 6) {
      setError("密码长度至少为 6 位");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || "注册失败，请尝试其他邮箱");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(err.message || "Google 登录失败");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-8 flex flex-col justify-center min-h-screen relative animate-reveal bg-[var(--bg-base)]">
      <div className="text-center space-y-3 relative z-10">
        <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 border border-[var(--border)]">
          <MapPin className="w-8 h-8 text-[var(--accent)]" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[var(--text-base)]">
            创建账号
          </h1>
          <p className="text-[var(--text-muted)] font-bold text-[10px] uppercase tracking-widest">Create Account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 relative z-10 max-w-sm mx-auto w-full">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-base)] ml-0.5">邮箱地址</label>
          <input 
            type="email"
            className="clean-input"
            placeholder="输入您的邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-base)] ml-0.5">密码</label>
          <input 
            type="password"
            className="clean-input"
            placeholder="创建密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-base)] ml-0.5">确认密码</label>
          <input 
            type="password"
            className="clean-input"
            placeholder="再次输入密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-500 rounded-lg font-semibold text-xs">
            {error}
          </div>
        )}

        <button
          disabled={loading || googleLoading}
          type="submit"
          className="clean-btn-primary mt-4"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              注册
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border)]"></div>
          </div>
          <div className="relative flex justify-center text-[10px]">
            <span className="bg-[var(--bg-base)] px-3 text-[var(--text-muted)] font-bold uppercase tracking-wider">或</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="clean-btn-secondary"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
              使用 Google 登录
            </>
          )}
        </button>
      </form>

      <div className="text-center relative z-10 pt-2">
        <p className="text-xs font-medium text-[var(--text-muted)]">
          已有账号？{' '}
          <Link to="/login" className="text-[var(--accent)] hover:underline font-bold">
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
};
