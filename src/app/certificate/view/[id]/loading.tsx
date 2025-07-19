import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="py-8 md:py-12 bg-muted/40 animate-pulse">
        <div className="container mx-auto px-4 md:px-6">
            <div className="bg-white w-full max-w-5xl mx-auto shadow-2xl rounded-lg overflow-hidden flex flex-col relative p-2">
                <div className="w-full h-full border-4 border-muted p-2">
                    <div className="w-full h-full border-2 border-muted flex flex-col relative text-center items-center justify-between p-8 bg-slate-50/50 min-h-[550px] md:min-h-[600px] space-y-8">

                        <div className="w-full flex justify-between items-start z-10">
                            <div className="text-left">
                                <Skeleton className="h-4 w-24 mb-1" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                            <div className="text-right">
                                <Skeleton className="h-20 w-20 rounded-full" />
                            </div>
                        </div>

                        <div className="text-center z-10 py-4 w-full max-w-lg">
                             <Skeleton className="h-4 w-48 mx-auto mb-2" />
                             <Skeleton className="h-10 w-full mb-2" />
                             <Skeleton className="h-6 w-40 mx-auto" />
                        </div>
                        
                        <div className="my-4 z-10 py-4 w-full max-w-2xl space-y-4">
                             <Skeleton className="h-6 w-1/2 mx-auto" />
                             <Skeleton className="h-16 w-3/4 mx-auto" />
                             <Skeleton className="h-6 w-full mx-auto" />
                        </div>
                        
                        <div className="w-full flex items-end justify-between z-10 pt-4">
                            <div className="text-center w-1/3 space-y-2">
                                <Skeleton className="h-6 w-3/4 mx-auto" />
                                <Skeleton className="h-px w-full" />
                                <Skeleton className="h-4 w-1/2 mx-auto" />
                            </div>

                            <div className="text-center w-1/3">
                                 <Skeleton className="h-16 w-16 mx-auto" />
                            </div>
                            
                            <div className="text-center w-1/3 space-y-2">
                                <Skeleton className="h-6 w-3/4 mx-auto" />
                                <Skeleton className="h-px w-full" />
                                <Skeleton className="h-4 w-1/2 mx-auto" />
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-48" />
            </div>
        </div>
    </div>
  );
}
