"use client";

import {
  EnhancedOnlineService,
  EnhancedTrainingService,
} from "@/services/enhancedServicesService";
import { BadgeCheck, CircleCheck, Clock } from "lucide-react";

interface ServiceFeaturesProps {
  service: EnhancedTrainingService | EnhancedOnlineService;
  isTraining: boolean;
}

export function ServiceFeatures({ service, isTraining }: ServiceFeaturesProps) {
  const trainingService = isTraining
    ? (service as EnhancedTrainingService)
    : null;
  const onlineService = !isTraining ? (service as EnhancedOnlineService) : null;

  return (
    <div className="space-y-3">
      {/* Duration/Processing Time */}
      <div className="flex items-center space-x-3 text-sm text-gray-700 bg-gray-50/50 rounded-lg p-3 border border-gray-100">
        <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Clock className="h-4 w-4 text-white" />
        </div>
        <span className="font-medium">
          {isTraining && trainingService
            ? `${trainingService.duration.value} ${trainingService.duration.unit}`
            : onlineService
            ? `${onlineService.processingTime.value} ${onlineService.processingTime.unit}`
            : "Duration not specified"}
        </span>
      </div>

      {/* Max Students for Training */}
      {isTraining && trainingService?.maxStudents && (
        <div className="flex items-center space-x-3 text-sm text-gray-700 bg-gray-50/50 rounded-lg p-3 border border-gray-100">
          <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BadgeCheck className="h-4 w-4 text-white" />
          </div>
          <span className="font-medium">
            Max {trainingService.maxStudents} students
          </span>
        </div>
      )}

      {/* Features List */}
      <div className="space-y-2.5">
        {isTraining && trainingService ? (
          <>
            {trainingService.services.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex items-start space-x-3 text-sm">
                <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                  <CircleCheck className="h-3 w-3 text-white" />
                </div>
                <span className="text-gray-700 leading-relaxed font-medium">
                  {item}
                </span>
              </div>
            ))}
            {trainingService.services.length > 3 && (
              <button className="text-sm text-blue-600 font-medium pl-8 hover:text-blue-700 focus:text-blue-700 focus:outline-none focus:underline transition-colors">
                +{trainingService.services.length - 3} more features
              </button>
            )}
          </>
        ) : (
          onlineService && (
            <>
              {onlineService.features.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-sm">
                  <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    <CircleCheck className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-gray-700 leading-relaxed font-medium">
                    {item}
                  </span>
                </div>
              ))}
              {onlineService.features.length > 3 && (
                <button className="text-sm text-blue-600 font-medium pl-8 hover:text-blue-700 focus:text-blue-700 focus:outline-none focus:underline transition-colors">
                  +{onlineService.features.length - 3} more features
                </button>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}
