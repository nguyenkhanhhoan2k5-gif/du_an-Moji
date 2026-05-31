import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";
import { chatService } from "@/services/chatService";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage } = useChatStore();
  const [value, setValue] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const clearImageSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);
    setImagePreview("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setSelectedImage(file);
    setImagePreview(previewUrl);
  };

  const sendImage = async () => {
    if (!selectedImage) return;
    if (!user) return toast.error("Bạn cần đăng nhập");

    const form = new FormData();
    form.append("file", selectedImage);

    try {
      let message;

      if (selectedConvo.type === "direct") {
        const participants = selectedConvo.participants;
        const otherUser = participants.find(
          (p) => p._id.toString() !== user._id.toString(),
        );

        if (!otherUser) {
          toast.error("Không tìm thấy người nhận");
          return;
        }

        form.append("recipientId", otherUser._id);
        if (selectedConvo._id) {
          form.append("conversationId", selectedConvo._id);
        }

        message = await chatService.uploadDirectImage(form);
      } else {
        form.append("conversationId", selectedConvo._id);
        message = await chatService.uploadGroupImage(form);
      }

      useChatStore.getState().addMessage(message);
      toast.success("Gửi ảnh thành công");
      clearImageSelection();
    } catch (error: any) {
      console.error("sendImage error", error?.response ?? error);
      const errorMessage =
        error?.response?.data?.message || error?.message || "Lỗi khi gửi ảnh";
      toast.error(errorMessage);
    }
  };

  if (!user) return;

  const sendMessage = async () => {
    if (!value.trim()) return;
    const currValue = value;
    setValue("");

    try {
      if (selectedConvo.type === "direct") {
        const participants = selectedConvo.participants;
        const otherUser = participants.find(
          (p) => p._id.toString() !== user._id.toString(),
        );

        if (!otherUser) {
          toast.error("Không tìm thấy người nhận");
          return;
        }

        await sendDirectMessage(otherUser._id, currValue);
      } else {
        await sendGroupMessage(selectedConvo._id, currValue);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-2">
      {imagePreview && (
        <div className="rounded-lg border border-border/50 bg-white p-3 shadow-sm">
          <div className="mb-3 overflow-hidden rounded-lg">
            <img
              src={imagePreview}
              alt="preview"
              className="max-h-60 w-full object-contain"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground truncate">
              {selectedImage?.name}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-9"
                onClick={clearImageSelection}
              >
                Hủy
              </Button>
              <Button variant="primary" className="h-9" onClick={sendImage}>
                Gửi ảnh
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 p-3 min-h-[56px] bg-background">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10 transition-smooth"
          onClick={handleImageClick}
        >
          <ImagePlus className="size-4" />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex-1 relative">
          <Input
            onKeyPress={handleKeyPress}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Soạn tin nhắn..."
            className="pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none"
          ></Input>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-8 hover:bg-primary/10 transition-smooth"
            >
              <div>
                <EmojiPicker
                  onChange={(emoji: string) => setValue(`${value}${emoji}`)}
                />
              </div>
            </Button>
          </div>
        </div>

        <Button
          onClick={sendMessage}
          className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105"
          disabled={!value.trim()}
        >
          <Send className="size-4 text-white" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
