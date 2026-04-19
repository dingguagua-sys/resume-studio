import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "我的简历" },
    templateId: { type: String, default: "classic" },
    /** Ordered section keys for drag layout */
    sectionOrder: { type: [String], default: ["summary", "experience", "education", "skills", "projects"] },
    /** Full resume payload edited on client */
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    shareId: { type: String, unique: true, sparse: true, index: true },
  },
  { timestamps: true }
);

export type ResumeDoc = mongoose.InferSchemaType<typeof ResumeSchema> & { _id: mongoose.Types.ObjectId };
export const Resume = mongoose.models.Resume || mongoose.model("Resume", ResumeSchema);
