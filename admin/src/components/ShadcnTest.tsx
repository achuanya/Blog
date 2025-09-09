import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function ShadcnTest() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Shadcn/UI 测试组件</h1>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>测试表单</CardTitle>
          <CardDescription>
            这是一个使用 shadcn/ui 组件的测试表单
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <Input id="name" placeholder="请输入您的姓名" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">消息</Label>
            <Textarea id="message" placeholder="请输入您的消息" />
          </div>
          
          <div className="flex space-x-2">
            <Button>提交</Button>
            <Button variant="outline">取消</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}