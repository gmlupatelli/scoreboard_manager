import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Logo from '@/components/ui/Logo';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <Logo size={80} />
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-4">About Us</h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Learn more about Scoreboard Manager and our mission to make score tracking simple and accessible.
            </p>
          </div>

          <div className="space-y-8">
            <section className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-text-primary mb-4">Our Mission</h2>
              <p className="text-text-secondary leading-relaxed">
                Scoreboard Manager was created with a simple goal: to provide an easy-to-use, reliable platform for managing scoreboards for any type of competition. Whether you're running a local sports tournament, a gaming championship, or a company event, we believe tracking scores should be effortless and accessible to everyone.
              </p>
            </section>

            <section className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-text-primary mb-4">What We Offer</h2>
              <ul className="space-y-4 text-text-secondary">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-text-primary">Real-time Updates:</strong> Scores update instantly across all devices, perfect for displaying on TVs and screens at your venue.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-text-primary">Easy Management:</strong> Add, edit, and organize entries with an intuitive interface that anyone can use.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-text-primary">Public Sharing:</strong> Share your scoreboards with participants and spectators through simple, shareable links.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-text-primary">CSV Import:</strong> Quickly import large lists of participants from spreadsheets.</span>
                </li>
              </ul>
            </section>

            <section className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-text-primary mb-4">Our Story</h2>
              <p className="text-text-secondary leading-relaxed">
                Scoreboard Manager started from a simple need: keeping track of scores during local tournaments without the hassle of complicated software or expensive solutions. We built a tool that's powerful enough for professional events yet simple enough for anyone to use. Today, we're proud to help organizers around the world run smoother, more engaging competitions.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
