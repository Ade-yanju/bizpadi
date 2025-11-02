import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Shield,
  Zap,
  Users,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ShopyLanding() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const isDesktop = windowWidth >= 768;
  const isLarge = windowWidth >= 1024;

  const investors = [
    { count: "50,000+", label: "Active Investors" },
    { count: "₦2.5M+", label: "Total Invested" },
    { count: "15%", label: "Avg. Annual Return" },
    { count: "24/7", label: "Trading Available" },
  ];

  const steps = [
    {
      step: "1",
      title: "Create your account",
      description: "Sign up in minutes and verify your identity securely",
    },
    {
      step: "2",
      title: "Browse virtual shops",
      description: "Explore diverse investment opportunities across categories",
    },
    {
      step: "3",
      title: "Start investing",
      description: "Buy virtual shops and watch your portfolio grow",
    },
  ];

  const features = [
    {
      icon: <Shield style={{ width: "32px", height: "32px" }} />,
      title: "Secure & Transparent",
      description:
        "Bank-level security with full transparency on all transactions and holdings",
    },
    {
      icon: <TrendingUp style={{ width: "32px", height: "32px" }} />,
      title: "High Growth Potential",
      description:
        "Access to curated virtual shops with proven track records and growth metrics",
    },
    {
      icon: <Zap style={{ width: "32px", height: "32px" }} />,
      title: "Instant Trading",
      description:
        "Buy and sell virtual shops instantly with real-time market pricing",
    },
    {
      icon: <Users style={{ width: "32px", height: "32px" }} />,
      title: "Community Driven",
      description:
        "Join thousands of investors sharing insights and strategies",
    },
  ];

  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(to bottom, #0f172a, #1e293b, #0f172a)",
      color: "white",
    },
    nav: {
      position: "fixed",
      width: "100%",
      zIndex: 50,
      transition: "all 0.3s",
      background: scrolled ? "rgba(15, 23, 42, 0.95)" : "transparent",
      backdropFilter: scrolled ? "blur(8px)" : "none",
      boxShadow: scrolled ? "0 10px 15px -3px rgba(0, 0, 0, 0.1)" : "none",
    },
    navContainer: {
      maxWidth: "1280px",
      margin: "0 auto",
      padding: "0 1rem",
    },
    navContent: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      height: "64px",
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    logoIcon: {
      width: "40px",
      height: "40px",
      background: "linear-gradient(to bottom right, #34d399, #06b6d4)",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    logoText: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      background: "linear-gradient(to right, #34d399, #06b6d4)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    },
    navLinksDesktop: {
      display: isDesktop ? "flex" : "none",
      alignItems: "center",
      gap: "1rem",
    },
    navLink: {
      color: "white",
      textDecoration: "none",
      transition: "color 0.3s",
      fontSize: isLarge ? "1rem" : "0.875rem",
    },
    loginBtn: {
      padding: "0.5rem 1rem",
      color: "#34d399",
      border: "1px solid #34d399",
      borderRadius: "9999px",
      background: "transparent",
      cursor: "pointer",
      transition: "all 0.3s",
      fontSize: isLarge ? "1rem" : "0.875rem",
      fontWeight: "500",
    },
    signUpBtn: {
      padding: "0.5rem 1rem",
      background: "linear-gradient(to right, #10b981, #06b6d4)",
      borderRadius: "9999px",
      border: "none",
      color: "white",
      cursor: "pointer",
      transition: "all 0.3s",
      fontSize: isLarge ? "1rem" : "0.875rem",
      fontWeight: "600",
    },
    menuButton: {
      background: "none",
      border: "none",
      color: "white",
      cursor: "pointer",
      display: isDesktop ? "none" : "block",
    },
    mobileMenu: {
      background: "rgba(15, 23, 42, 0.95)",
      backdropFilter: "blur(8px)",
      padding: "0.5rem",
    },
    mobileMenuItem: {
      display: "block",
      padding: "0.5rem 0.75rem",
      color: "white",
      textDecoration: "none",
      borderRadius: "0.375rem",
      transition: "background 0.3s",
    },
    mobileButtons: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      padding: "0.75rem",
      paddingTop: "0.5rem",
    },
    hero: {
      paddingTop: "8rem",
      paddingBottom: "5rem",
      paddingLeft: "1rem",
      paddingRight: "1rem",
      position: "relative",
      overflow: "hidden",
    },
    heroGradient: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1))",
      filter: "blur(80px)",
    },
    heroContent: {
      maxWidth: "896px",
      margin: "0 auto",
      textAlign: "center",
      position: "relative",
      zIndex: 10,
    },
    badge: {
      display: "inline-block",
      marginBottom: "1.5rem",
      padding: "0.5rem 1rem",
      background: "rgba(30, 41, 59, 0.5)",
      borderRadius: "9999px",
      border: "1px solid rgba(52, 211, 153, 0.3)",
    },
    badgeText: {
      color: "#34d399",
      fontSize: "0.875rem",
      fontWeight: "600",
    },
    h1: {
      fontSize: isLarge ? "4.5rem" : isDesktop ? "3.75rem" : "3rem",
      fontWeight: "bold",
      marginBottom: "1.5rem",
      lineHeight: "1.2",
    },
    h1Gradient: {
      display: "block",
      background: "linear-gradient(to right, #34d399, #06b6d4)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    },
    heroPara: {
      fontSize: "1.125rem",
      color: "#cbd5e1",
      marginBottom: "2rem",
      maxWidth: "672px",
      margin: "0 auto 2rem auto",
      lineHeight: "1.75",
    },
    ctaBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "1rem 2rem",
      background: "linear-gradient(to right, #10b981, #06b6d4)",
      borderRadius: "9999px",
      fontSize: "1.125rem",
      fontWeight: "600",
      border: "none",
      color: "white",
      cursor: "pointer",
      transition: "all 0.3s",
    },
    stats: {
      marginTop: "5rem",
      display: "grid",
      gridTemplateColumns: isDesktop ? "repeat(4, 1fr)" : "repeat(2, 1fr)",
      gap: "2rem",
    },
    statItem: {
      transition: "transform 0.3s",
    },
    statCount: {
      fontSize: isDesktop ? "2.5rem" : "2rem",
      fontWeight: "bold",
      background: "linear-gradient(to right, #34d399, #06b6d4)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    },
    statLabel: {
      color: "#94a3b8",
      marginTop: "0.5rem",
      fontSize: isDesktop ? "1rem" : "0.875rem",
    },
    trusted: {
      padding: "4rem 1rem",
      background: "rgba(30, 41, 59, 0.3)",
    },
    trustedContainer: {
      maxWidth: "1280px",
      margin: "0 auto",
      textAlign: "center",
    },
    trustedText: {
      color: "#94a3b8",
      fontSize: "1.125rem",
      marginBottom: "2rem",
    },
    trustedLogos: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "center",
      gap: "3rem",
      opacity: 0.6,
    },
    trustedLogo: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: "#64748b",
    },
    section: {
      padding: "5rem 1rem",
    },
    sectionBg: {
      padding: "5rem 1rem",
      background: "rgba(30, 41, 59, 0.3)",
    },
    sectionContainer: {
      maxWidth: "1152px",
      margin: "0 auto",
    },
    sectionContainerLarge: {
      maxWidth: "1280px",
      margin: "0 auto",
    },
    h2: {
      fontSize: isDesktop ? "2.5rem" : "2rem",
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: "4rem",
    },
    sectionSubtitle: {
      textAlign: "center",
      color: "#94a3b8",
      marginBottom: "4rem",
      fontSize: "1.125rem",
    },
    grid3: {
      display: "grid",
      gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr",
      gap: "2rem",
    },
    grid4: {
      display: "grid",
      gridTemplateColumns: isLarge
        ? "repeat(4, 1fr)"
        : isDesktop
        ? "repeat(2, 1fr)"
        : "1fr",
      gap: "2rem",
    },
    stepCard: {
      position: "relative",
      padding: "2rem",
      background: "linear-gradient(to bottom right, #1e293b, #0f172a)",
      borderRadius: "1rem",
      border: "1px solid #334155",
      transition: "all 0.3s",
    },
    stepNumber: {
      position: "absolute",
      top: "-1rem",
      left: "2rem",
      width: "3rem",
      height: "3rem",
      background: "linear-gradient(to right, #10b981, #06b6d4)",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.25rem",
      fontWeight: "bold",
    },
    stepTitle: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      marginTop: "1rem",
      marginBottom: "0.75rem",
    },
    stepDesc: {
      color: "#94a3b8",
    },
    featureCard: {
      padding: "2rem",
      borderRadius: "1rem",
      border: "1px solid #334155",
      background: "#0f172a",
      transition: "all 0.3s",
      cursor: "pointer",
    },
    featureCardActive: {
      padding: "2rem",
      borderRadius: "1rem",
      border: "1px solid rgba(52, 211, 153, 0.5)",
      background:
        "linear-gradient(to bottom right, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))",
      boxShadow: "0 20px 25px -5px rgba(16, 185, 129, 0.2)",
      transition: "all 0.3s",
      cursor: "pointer",
      transform: "scale(1.05)",
    },
    featureIcon: {
      marginBottom: "1rem",
      color: "#94a3b8",
      transition: "color 0.3s",
    },
    featureIconActive: {
      marginBottom: "1rem",
      color: "#34d399",
      transition: "color 0.3s",
    },
    featureTitle: {
      fontSize: "1.25rem",
      fontWeight: "bold",
      marginBottom: "0.75rem",
    },
    featureDesc: {
      color: "#94a3b8",
    },
    footer: {
      padding: "3rem 1rem",
      borderTop: "1px solid #1e293b",
    },
    footerGrid: {
      display: "grid",
      gridTemplateColumns: isDesktop ? "repeat(4, 1fr)" : "1fr",
      gap: "2rem",
      marginBottom: "2rem",
    },
    footerBrand: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      marginBottom: "1rem",
    },
    footerLogo: {
      width: "32px",
      height: "32px",
      background: "linear-gradient(to bottom right, #34d399, #06b6d4)",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    footerTitle: {
      fontSize: "1.25rem",
      fontWeight: "bold",
    },
    footerText: {
      color: "#94a3b8",
    },
    footerHeading: {
      fontWeight: "600",
      marginBottom: "1rem",
    },
    footerLinks: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
    },
    footerLink: {
      color: "#94a3b8",
      textDecoration: "none",
      transition: "color 0.3s",
    },
    footerBottom: {
      paddingTop: "2rem",
      borderTop: "1px solid #1e293b",
      textAlign: "center",
      color: "#94a3b8",
    },
  };

  return (
    <div style={styles.container}>
      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navContainer}>
          <div style={styles.navContent}>
            <div style={styles.logo}>
              <div style={styles.logoIcon}>
                <TrendingUp
                  style={{ width: "24px", height: "24px", color: "white" }}
                />
              </div>
              <span style={styles.logoText}>Shopy</span>
            </div>

            <div style={styles.navLinksDesktop}>
              <a
                href="#how"
                style={styles.navLink}
                onMouseEnter={(e) => (e.target.style.color = "#34d399")}
                onMouseLeave={(e) => (e.target.style.color = "white")}
              >
                How It Works
              </a>
              <a
                href="#features"
                style={styles.navLink}
                onMouseEnter={(e) => (e.target.style.color = "#34d399")}
                onMouseLeave={(e) => (e.target.style.color = "white")}
              >
                Features
              </a>
              <a
                href="#about"
                style={styles.navLink}
                onMouseEnter={(e) => (e.target.style.color = "#34d399")}
                onMouseLeave={(e) => (e.target.style.color = "white")}
              >
                About
              </a>
              <button
                style={styles.loginBtn}
                onClick={() => navigate("/auth/login")}
                onMouseEnter={(e) =>
                  (e.target.style.background = "rgba(52, 211, 153, 0.1)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.background = "transparent")
                }
              >
                Login
              </button>
              <button
                style={styles.signUpBtn}
                onClick={() => navigate("/auth/register")}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow =
                    "0 10px 15px -3px rgba(16, 185, 129, 0.5)";
                  e.target.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = "none";
                  e.target.style.transform = "scale(1)";
                }}
              >
                Sign Up
              </button>
            </div>

            <button
              style={styles.menuButton}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div style={styles.mobileMenu}>
            <div style={{ padding: "0.5rem" }}>
              <a
                href="#how"
                style={styles.mobileMenuItem}
                onMouseEnter={(e) => (e.target.style.background = "#1e293b")}
                onMouseLeave={(e) =>
                  (e.target.style.background = "transparent")
                }
              >
                How It Works
              </a>
              <a
                href="#features"
                style={styles.mobileMenuItem}
                onMouseEnter={(e) => (e.target.style.background = "#1e293b")}
                onMouseLeave={(e) =>
                  (e.target.style.background = "transparent")
                }
              >
                Features
              </a>
              <a
                href="#about"
                style={styles.mobileMenuItem}
                onMouseEnter={(e) => (e.target.style.background = "#1e293b")}
                onMouseLeave={(e) =>
                  (e.target.style.background = "transparent")
                }
              >
                About
              </a>
              <div style={styles.mobileButtons}>
                <button
                  style={styles.loginBtn}
                  onClick={() => navigate("/auth/login")}
                  onMouseEnter={(e) =>
                    (e.target.style.background = "rgba(52, 211, 153, 0.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.background = "transparent")
                  }
                >
                  Login
                </button>
                <button
                  style={styles.signUpBtn}
                  onClick={() => navigate("/auth/register")}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow =
                      "0 10px 15px -3px rgba(16, 185, 129, 0.5)";
                    e.target.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = "none";
                    e.target.style.transform = "scale(1)";
                  }}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroGradient}></div>

        <div style={styles.heroContent}>
          <div style={styles.badge}>
            <span style={styles.badgeText}>Virtual Investment Platform</span>
          </div>

          <h1 style={styles.h1}>
            Invest in Virtual Shops.
            <span style={styles.h1Gradient}>Earn Real Profits.</span>
          </h1>

          <p style={styles.heroPara}>
            Join thousands of investors building wealth through virtual property
            investments. Start with as little as ₦1,000 and watch your portfolio
            grow.
          </p>

          <button
            style={styles.ctaBtn}
            onMouseEnter={(e) => {
              e.target.style.boxShadow =
                "0 25px 50px -12px rgba(16, 185, 129, 0.5)";
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = "none";
              e.target.style.transform = "scale(1)";
            }}
          >
            <span>Start Investing Today</span>
            <ChevronDown style={{ width: "20px", height: "20px" }} />
          </button>

          <div style={styles.stats}>
            {investors.map((stat, idx) => (
              <div
                key={idx}
                style={styles.statItem}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <div style={styles.statCount}>{stat.count}</div>
                <div style={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted Section */}
      <section style={styles.trusted}>
        <div style={styles.trustedContainer}>
          <p style={styles.trustedText}>TRUSTED BY OVER 50,000 INVESTORS</p>
          <div style={styles.trustedLogos}>
            {["INVESTOR", "TRADER", "BUILDER", "CREATOR"].map((name, idx) => (
              <div key={idx} style={styles.trustedLogo}>
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" style={styles.section}>
        <div style={styles.sectionContainer}>
          <h2 style={styles.h2}>
            How It <span style={styles.h1Gradient}>Works</span>
          </h2>

          <div style={styles.grid3}>
            {steps.map((item, idx) => (
              <div
                key={idx}
                style={styles.stepCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(52, 211, 153, 0.5)";
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow =
                    "0 20px 25px -5px rgba(16, 185, 129, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#334155";
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={styles.stepNumber}>{item.step}</div>
                <h3 style={styles.stepTitle}>{item.title}</h3>
                <p style={styles.stepDesc}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={styles.sectionBg}>
        <div style={styles.sectionContainerLarge}>
          <h2 style={styles.h2}>
            Join Thousands of{" "}
            <span style={styles.h1Gradient}>Successful Investors</span>
          </h2>
          <p style={styles.sectionSubtitle}>
            Everything you need to build wealth through virtual Shops
          </p>

          <div style={styles.grid4}>
            {features.map((feature, idx) => (
              <div
                key={idx}
                style={
                  activeCard === idx
                    ? styles.featureCardActive
                    : styles.featureCard
                }
                onMouseEnter={() => setActiveCard(idx)}
                onMouseLeave={() => setActiveCard(null)}
              >
                <div
                  style={
                    activeCard === idx
                      ? styles.featureIconActive
                      : styles.featureIcon
                  }
                >
                  {feature.icon}
                </div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDesc}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.section}>
        <div
          style={{ maxWidth: "896px", margin: "0 auto", textAlign: "center" }}
        >
          <h2 style={styles.h2}>
            Ready to Start Your{" "}
            <span style={styles.h1Gradient}>Investment Journey?</span>
          </h2>
          <p style={{ ...styles.heroPara, fontSize: "1.25rem" }}>
            Join our community of investors and start building wealth today
          </p>
          <button
            style={styles.ctaBtn}
            onMouseEnter={(e) => {
              e.target.style.boxShadow =
                "0 25px 50px -12px rgba(16, 185, 129, 0.5)";
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = "none";
              e.target.style.transform = "scale(1)";
            }}
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.sectionContainerLarge}>
          <div style={styles.footerGrid}>
            <div>
              <div style={styles.footerBrand}>
                <div style={styles.footerLogo}>
                  <TrendingUp
                    style={{ width: "20px", height: "20px", color: "white" }}
                  />
                </div>
                <span style={styles.footerTitle}>Shopy</span>
              </div>
              <p style={styles.footerText}>
                Invest in virtual shops, earn real profits.
              </p>
            </div>
            <div>
              <h4 style={styles.footerHeading}>Product</h4>
              <div style={styles.footerLinks}>
                <a
                  href="#"
                  style={styles.footerLink}
                  onMouseEnter={(e) => (e.target.style.color = "#34d399")}
                  onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
                >
                  Features
                </a>
                <a
                  href="#"
                  style={styles.footerLink}
                  onMouseEnter={(e) => (e.target.style.color = "#34d399")}
                  onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
                >
                  Pricing
                </a>
                <a
                  href="#"
                  style={styles.footerLink}
                  onMouseEnter={(e) => (e.target.style.color = "#34d399")}
                  onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
                >
                  FAQ
                </a>
              </div>
            </div>
            <div>
              <h4 style={styles.footerHeading}>Company</h4>
              <div style={styles.footerLinks}>
                <a
                  href="#"
                  style={styles.footerLink}
                  onMouseEnter={(e) => (e.target.style.color = "#34d399")}
                  onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
                >
                  About
                </a>
                <a
                  href="#"
                  style={styles.footerLink}
                  onMouseEnter={(e) => (e.target.style.color = "#34d399")}
                  onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
                >
                  Blog
                </a>
                <a
                  href="#"
                  style={styles.footerLink}
                  onMouseEnter={(e) => (e.target.style.color = "#34d399")}
                  onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
                >
                  Careers
                </a>
              </div>
            </div>
            <div>
              <h4 style={styles.footerHeading}>Legal</h4>
              <div style={styles.footerLinks}>
                <a
                  href="#"
                  style={styles.footerLink}
                  onMouseEnter={(e) => (e.target.style.color = "#34d399")}
                  onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
                >
                  Privacy
                </a>
                <a
                  href="#"
                  style={styles.footerLink}
                  onMouseEnter={(e) => (e.target.style.color = "#34d399")}
                  onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
                >
                  Terms
                </a>
                <a
                  href="#"
                  style={styles.footerLink}
                  onMouseEnter={(e) => (e.target.style.color = "#34d399")}
                  onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
                >
                  Security
                </a>
              </div>
            </div>
          </div>
          <div style={styles.footerBottom}>
            <p>&copy; 2025 Shopy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
