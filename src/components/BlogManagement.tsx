import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash, Edit, Upload } from "lucide-react";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "@/hooks/use-toast";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import mammoth from 'mammoth';

import { Loader2 } from "lucide-react";

const BlogManagement = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "blogs"));
      const blogsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBlogs(blogsData);
    } catch (error) {
      console.error("Error fetching blogs: ", error);
      toast({ title: "Error", description: "Failed to fetch blogs.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          if (arrayBuffer) {
            const result = await mammoth.convertToHtml({ arrayBuffer });
            setFormData(prev => ({ ...prev, content: result.value }));
          }
        };
        reader.readAsArrayBuffer(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast({ title: "Validation Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const docRef = doc(db, "blogs", isEditing);
        await updateDoc(docRef, { ...formData, updatedAt: serverTimestamp() });
        toast({ title: "Success", description: "Blog post updated successfully." });
      } else {
        await addDoc(collection(db, "blogs"), { ...formData, createdAt: serverTimestamp() });
        toast({ title: "Success", description: "Blog post added successfully." });
      }
      resetForm();
      fetchBlogs();
    } catch (error) {
      console.error("Error saving blog post: ", error);
      toast({ title: "Error", description: "Failed to save blog post.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (blog: any) => {
    setIsEditing(blog.id);
    setFormData({ title: blog.title, content: blog.content });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "blogs", id));
      toast({ title: "Success", description: "Blog post deleted successfully." });
      fetchBlogs();
    } catch (error) {
      console.error("Error deleting blog post: ", error);
      toast({ title: "Error", description: "Failed to delete blog post.", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setIsEditing(null);
    setFormData({ title: '', content: '' });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Blog Post' : 'Add New Blog Post'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="title" placeholder="Blog Title" value={formData.title} onChange={handleInputChange} />
            <div className="h-[350px]">
              <ReactQuill ref={quillRef} theme="snow" value={formData.content} onChange={handleContentChange} className="h-[300px]" />
            </div>
            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : isEditing ? (
                  'Update Post'
                ) : (
                  'Add Post'
                )}
              </Button>
              {isEditing && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
              <div className="flex items-center">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button asChild variant="outline">
                    <span><Upload className="h-4 w-4 mr-2" /> Upload .docx</span>
                  </Button>
                </label>
                <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".docx" />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Blog Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading blogs...</p>
          ) : (
            <ul className="space-y-4">
              {blogs.map(blog => (
                <li key={blog.id} className="flex justify-between items-center p-2 border rounded">
                  <span>{blog.title}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(blog)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(blog.id)}><Trash className="h-4 w-4" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BlogManagement;