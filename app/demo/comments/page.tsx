import { DemoCommentsSection } from '@/components/demo-comments'

export default function DemoCommentsPage() {
  return (
    <div className="demo-comments-page">
      <div className="demo-comments-container">
        <h1 className="demo-comments-heading">二级评论系统演示</h1>
        <p className="demo-comments-description">
          这是一个二级评论系统的演示页面。点击评论下方的「回复」按钮，即可对评论进行回复。
        </p>
        <DemoCommentsSection />
      </div>
    </div>
  )
}
