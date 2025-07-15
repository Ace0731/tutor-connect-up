import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Mail, Phone, ArrowLeft } from "lucide-react";
import { db } from "@/integrations/firebase/client";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Blog {
  id: string;
  title: string;
  content: string;
  createdAt: Timestamp;
}

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      if (id) {
        try {
          const docRef = doc(db, "blogs", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setBlog({ id: docSnap.id, ...docSnap.data() } as Blog);
          }
        } catch (error) {
          console.error("Error fetching blog post: ", error);
        }
      }
      setLoading(false);
    };

    fetchBlog();
  }, [id]);

  // Inject AdSense script (only once)
  useEffect(() => {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7270729548756015";
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  }, []);

  // Trigger ad render after blog is loaded
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("Adsense error:", e);
    }
  }, [blog]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>{blog?.title || 'Blog Post'} | TutorConnect</title>
      </Helmet>

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/blogs" className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              TutorConnect Blogs
            </h1>
          </Link>
          <Button asChild>
            <Link to="/">Home</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {loading ? (
          <LoadingSpinner />
        ) : blog ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-4xl font-bold text-gray-800">{blog.title}</CardTitle>
              <div className="text-sm text-gray-500 pt-2">
                <span>By Admin</span> | <span>{blog.createdAt ? new Date(blog.createdAt.seconds * 1000).toLocaleDateString() : 'Date not available'}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: blog.content }} />

              {/* Google AdSense Ad Block */}
              <div className="my-8 flex justify-center">
                <ins
                  className="adsbygoogle"
                  style={{ display: "block", width: "100%", maxWidth: "320px", height: "250px" }}
                  data-ad-client="ca-pub-7270729548756015"
                  data-ad-slot="3881113608"
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                ></ins>
              </div>


              <Button asChild className="mt-8">
                <Link to="/blogs"><ArrowLeft className="h-4 w-4 mr-2" />Back to Blogs</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <p>Blog post not found.</p>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BookOpen className="h-6 w-6" />
            <span className="text-xl font-bold">TutorConnect</span>
          </div>
          <p className="text-gray-400">
            Connecting students and tutors across Kanpur, Lucknow, and Unnao
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0 sm:space-x-6 mt-4 text-sm text-center">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>info@thesahilsirstutorials.in</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>+91 8887622182</span>
            </div>
          </div>
          <a
            href="https://ace0731.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-6 text-gray-500 hover:text-white transition-colors"
          >
            <p>Made with ❤️ by <strong>Ace</strong></p>
          </a>
          <p>© 2025. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default BlogPost;
