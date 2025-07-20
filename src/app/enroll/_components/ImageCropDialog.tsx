
"use client";

import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/use-debounce';

interface ImageCropDialogProps {
  imageUrl: string;
  onCrop: (croppedImageUrl: string) => void;
  onClose: () => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}


export function ImageCropDialog({ imageUrl, onCrop, onClose }: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const debouncedScale = useDebounce(scale, 100);
  const debouncedRotate = useDebounce(rotate, 100);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }
  
  const handleCrop = () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
        return;
    }
    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const centerX = image.naturalWidth / 2;
    const centerY = image.naturalHeight / 2;

    ctx.save();
    ctx.translate(-cropX, -cropY);
    ctx.translate(centerX, centerY);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
    );
    ctx.restore();

    onCrop(canvas.toDataURL('image/jpeg', 0.92));
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Crop Your Photo</DialogTitle>
          <DialogDescription>
            Adjust the image to fit perfectly. This will be used for your profile and certificate.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center bg-muted/50 p-4 rounded-md">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              minWidth={100}
              minHeight={100}
              aria-label="Image crop area"
            >
              <Image
                ref={imgRef}
                alt="Image to crop"
                src={imageUrl}
                width={500}
                height={500}
                style={{ transform: `scale(${debouncedScale}) rotate(${debouncedRotate}deg)` }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="scale-slider" aria-label="Zoom control">Zoom</Label>
                <span className="text-sm text-muted-foreground">{Math.round(scale * 100)}%</span>
              </div>
              <Slider id="scale-slider" defaultValue={[1]} min={0.5} max={2} step={0.01} onValueChange={(value) => setScale(value[0])} />
            </div>
             <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="rotate-slider" aria-label="Rotation control">Rotate</Label>
                <span className="text-sm text-muted-foreground">{Math.round(rotate)}°</span>
              </div>
              <Slider id="rotate-slider" defaultValue={[0]} min={-180} max={180} step={1} onValueChange={(value) => setRotate(value[0])} />
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCrop}>Crop & Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
