import Header from "@/components/Header";
import { Hero, About, Consultancy, Counselling, Branding, Projects, Resources, Faq, Contact, Footer } from "@/components/Sections";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Consultancy />
        <Counselling />
        <Branding />
        <Projects />
        <Resources />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
