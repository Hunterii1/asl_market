import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, LogIn, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import HeaderAuth from "@/components/ui/HeaderAuth";

const Login = () => {
	const navigate = useNavigate();
	const { login, isLoading, isAuthenticated } = useAuth();
	const [formData, setFormData] = useState({
		phone: "",
		email: "",
		password: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [loginMethod, setLoginMethod] = useState<"phone" | "email">("phone");

	// Redirect if already authenticated
	if (isAuthenticated) {
		navigate("/");
		return null;
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		// Prepare login data based on selected method
		const loginData: any = {
			password: formData.password,
		};

		if (loginMethod === "phone") {
			loginData.phone = formData.phone;
		} else {
			loginData.email = formData.email;
		}

		try {
			await login(loginData);
			navigate("/");
		} catch (err) {
			// Error toast is handled in api.ts
			console.error("Login error:", err);
		}
	};

	const handleMethodChange = (method: "phone" | "email") => {
		setLoginMethod(method);
		// Clear the other field when switching methods
		if (method === "phone") {
			setFormData(prev => ({ ...prev, email: "" }));
		} else {
			setFormData(prev => ({ ...prev, phone: "" }));
		}
	};

	return (
		<div className="min-h-screen bg-background" dir="rtl">
			<HeaderAuth />
			<div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-3 sm:p-4">
				<div className="w-full max-w-sm sm:max-w-md">
					{/* Header */}
					<div className="text-center mb-6 sm:mb-8">
						<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">اصل مارکت</h1>
						<p className="text-sm sm:text-base text-muted-foreground">به پنل کاربری خود وارد شوید</p>
					</div>

					<Card className="bg-card/80 border-border rounded-2xl sm:rounded-3xl shadow-xl">
						<CardHeader className="pb-4 sm:pb-6">
							<CardTitle className="text-center text-foreground flex items-center justify-center gap-2 text-lg sm:text-xl">
								<LogIn className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
								ورود به حساب کاربری
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
							<Tabs value={loginMethod} onValueChange={(value) => handleMethodChange(value as "phone" | "email")} className="w-full">
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger value="phone">شماره موبایل</TabsTrigger>
									<TabsTrigger value="email">ایمیل</TabsTrigger>
								</TabsList>
								
								<TabsContent value="phone" className="space-y-4">
									<form onSubmit={handleSubmit} className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="phone" className="text-foreground">شماره موبایل</Label>
											<Input
												id="phone"
												name="phone"
												type="tel"
												placeholder="09123456789"
												value={formData.phone}
												onChange={handleChange}
												required
												className="bg-background border-border text-foreground rounded-xl sm:rounded-2xl h-11 sm:h-10"
												disabled={isLoading}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="password" className="text-foreground">رمز عبور</Label>
											<div className="relative">
												<Input
													id="password"
													name="password"
													type={showPassword ? "text" : "password"}
													placeholder="رمز عبور خود را وارد کنید"
													value={formData.password}
													onChange={handleChange}
													required
													className="bg-background border-border text-foreground rounded-xl sm:rounded-2xl pl-12 h-11 sm:h-10"
													disabled={isLoading}
												/>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													className="absolute left-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
													onClick={() => setShowPassword(!showPassword)}
													disabled={isLoading}
												>
													{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
												</Button>
											</div>
											<div className="text-left">
												<Link
													to="/forgot-password"
													className="text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors"
												>
													فراموشی رمز عبور؟
												</Link>
											</div>
										</div>

										<Button
											type="submit"
											className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl h-12 font-medium"
											disabled={isLoading}
										>
											{isLoading ? (
												<div className="flex items-center gap-2">
													<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
													در حال ورود...
												</div>
											) : (
												<div className="flex items-center gap-2">
													<ArrowRight className="w-4 h-4" />
													ورود
												</div>
											)}
										</Button>
									</form>
								</TabsContent>

								<TabsContent value="email" className="space-y-4">
									<form onSubmit={handleSubmit} className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="email" className="text-foreground">ایمیل</Label>
											<Input
												id="email"
												name="email"
												type="email"
												placeholder="example@email.com"
												value={formData.email}
												onChange={handleChange}
												required
												className="bg-background border-border text-foreground rounded-xl sm:rounded-2xl h-11 sm:h-10"
												disabled={isLoading}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="password" className="text-foreground">رمز عبور</Label>
											<div className="relative">
												<Input
													id="password"
													name="password"
													type={showPassword ? "text" : "password"}
													placeholder="رمز عبور خود را وارد کنید"
													value={formData.password}
													onChange={handleChange}
													required
													className="bg-background border-border text-foreground rounded-xl sm:rounded-2xl pl-12 h-11 sm:h-10"
													disabled={isLoading}
												/>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													className="absolute left-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
													onClick={() => setShowPassword(!showPassword)}
													disabled={isLoading}
												>
													{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
												</Button>
											</div>
											<div className="text-left">
												<Link
													to="/forgot-password"
													className="text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors"
												>
													فراموشی رمز عبور؟
												</Link>
											</div>
										</div>

										<Button
											type="submit"
											className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl h-12 font-medium"
											disabled={isLoading}
										>
											{isLoading ? (
												<div className="flex items-center gap-2">
													<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
													در حال ورود...
												</div>
											) : (
												<div className="flex items-center gap-2">
													<ArrowRight className="w-4 h-4" />
													ورود
												</div>
											)}
										</Button>
									</form>
								</TabsContent>
							</Tabs>

							<div className="text-center">
								<p className="text-muted-foreground">
									حساب کاربری ندارید؟{" "}
									<Link
										to="/signup"
										className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors"
									>
										ثبت‌نام کنید
									</Link>
								</p>
							</div>

							<div className="text-center">
								<Link
									to="/"
									className="text-muted-foreground hover:text-foreground transition-colors text-sm"
								>
									بازگشت به صفحه اصلی
								</Link>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default Login; 