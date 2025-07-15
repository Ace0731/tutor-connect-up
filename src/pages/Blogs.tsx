import { useState, useEffect } from 'react';
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Mail, Phone } from "lucide-react";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Blog {
  id: string;
  title: string;
  content: string;
  createdAt: Timestamp;
}

const Blogs = () => {
  const stripHtmlTags = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const blogsCollection = collection(db, "blogs");
        const q = query(blogsCollection, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const blogsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Blog[];
        setBlogs(blogsData);
      } catch (error) {
        console.error("Error fetching blogs: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>Blogs | TutorConnect</title>
        <meta name="description" content="Read our latest blogs on education, tutoring, and learning tips." />
      </Helmet>

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
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

      {/* Blogs Section */}
      <main className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
          Latest Articles
        </h2>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <Card key={blog.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-800">{blog.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    {blog.content ? `${stripHtmlTags(blog.content).substring(0, 100)}...` : "No content available."}
                  </p>
                  <div className="text-sm text-gray-500">
                    <span>By Admin</span> | <span>{blog.createdAt ? new Date(blog.createdAt.seconds * 1000).toLocaleDateString() : 'Date not available'}</span>
                  </div>
                  <Button asChild className="mt-4">
                    <Link to={`/blogs/${blog.id}`}>Read More</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
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

export default Blogs;