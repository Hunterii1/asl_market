import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/ui/Logo";

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

	useEffect(() => {
		if (isAuthenticated) {
			navigate("/dashboard");
		}
	}, [isAuthenticated, navigate]);

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

		await login(loginData);
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
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center space-y-4">
					<div className="flex justify-center">
						<Logo className="h-16 w-16" />
					</div>
					<div>
						<CardTitle className="text-2xl font-bold text-foreground">ورود به سیستم</CardTitle>
						<CardDescription className="text-muted-foreground">
							برای دسترسی به حساب کاربری خود وارد شوید
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent>
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
										className="bg-background border-border text-foreground rounded-2xl"
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
											className="bg-background border-border text-foreground rounded-2xl pr-10"
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
										>
											{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
										</button>
									</div>
								</div>
								<Button
									type="submit"
									className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl py-3 text-lg font-semibold transition-colors"
									disabled={isLoading}
								>
									{isLoading ? "در حال ورود..." : "ورود"}
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
										className="bg-background border-border text-foreground rounded-2xl"
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
											className="bg-background border-border text-foreground rounded-2xl pr-10"
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
										>
											{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
										</button>
									</div>
								</div>
								<Button
									type="submit"
									className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl py-3 text-lg font-semibold transition-colors"
									disabled={isLoading}
								>
									{isLoading ? "در حال ورود..." : "ورود"}
								</Button>
							</form>
						</TabsContent>
					</Tabs>

					<div className="mt-6 space-y-4">
						<div className="text-center">
							<Link
								to="/signup"
								className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors"
							>
								حساب کاربری ندارید؟ ثبت‌نام کنید
							</Link>
						</div>
						<div className="text-center">
							<Link
								to="/forgot-password"
								className="text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors"
							>
								فراموشی رمز عبور؟
							</Link>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default Login; 