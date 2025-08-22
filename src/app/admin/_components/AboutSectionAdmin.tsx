// Enhanced admin component for About section management
"use client";

import { AboutSectionEnhanced } from "@/app/(home)/_components/AboutSection.enhanced";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  settingsService,
  type AboutSectionMetrics,
} from "@/services/settingsService.enhanced";
import {
  BarChart3,
  Eye,
  Image as ImageIcon,
  RefreshCw,
  Save,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";

interface AboutSectionAdminProps {
  currentSettings: any;
  onSettingsUpdate: (settings: any) => void;
}

export function AboutSectionAdmin({
  currentSettings,
  onSettingsUpdate,
}: AboutSectionAdminProps) {
  const [settings, setSettings] = useState(currentSettings);
  const [metrics, setMetrics] = useState<AboutSectionMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  // Load real-time metrics
  useEffect(() => {
    async function loadMetrics() {
      try {
        const metricsData = await settingsService.getAboutSectionMetrics();
        setMetrics(metricsData);
      } catch (error) {
        console.error("Error loading metrics:", error);
      }
    }
    loadMetrics();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setSettings((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStatChange = (index: number, field: string, value: string) => {
    setSettings((prev: any) => ({
      ...prev,
      homepageStats: prev.homepageStats.map((stat: any, i: number) =>
        i === index ? { ...stat, [field]: value } : stat
      ),
    }));
  };

  const addNewStat = () => {
    setSettings((prev: any) => ({
      ...prev,
      homepageStats: [
        ...prev.homepageStats,
        { icon: "TrendingUp", value: "0", label: "New Stat" },
      ],
    }));
  };

  const removeStat = (index: number) => {
    setSettings((prev: any) => ({
      ...prev,
      homepageStats: prev.homepageStats.filter(
        (_: any, i: number) => i !== index
      ),
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSettingsUpdate(settings);
      toast({
        title: "Settings Updated",
        description: "About section settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshMetrics = async () => {
    setLoading(true);
    try {
      settingsService.clearCache();
      const newMetrics = await settingsService.getAboutSectionMetrics();
      setMetrics(newMetrics);
      toast({
        title: "Metrics Refreshed",
        description: "Real-time metrics have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh metrics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">About Section Management</h2>
          <p className="text-muted-foreground">
            Configure your homepage about section content and statistics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setPreviewMode(!previewMode)}
            variant="outline"
          >
            <Eye className="mr-2 h-4 w-4" />
            {previewMode ? "Edit Mode" : "Preview"}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {previewMode ? (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              How the about section will appear to visitors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AboutSectionEnhanced
              settings={settings}
              isAdmin={true}
              studentStats={
                metrics
                  ? {
                      totalEnrollments: metrics.totalEnrollments,
                      activeStudents: metrics.activeStudents,
                      completedCourses: metrics.completedCourses,
                    }
                  : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Text Content</CardTitle>
                <CardDescription>
                  Configure the main text content for the about section
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="aboutTitle">About Section Title</Label>
                  <Input
                    id="aboutTitle"
                    value={settings.homepageAboutTitle || ""}
                    onChange={(e) =>
                      handleInputChange("homepageAboutTitle", e.target.value)
                    }
                    placeholder="Your Path to Safe Driving"
                  />
                </div>

                <div>
                  <Label htmlFor="aboutText1">First Paragraph</Label>
                  <Textarea
                    id="aboutText1"
                    rows={4}
                    value={settings.homepageAboutText1 || ""}
                    onChange={(e) =>
                      handleInputChange("homepageAboutText1", e.target.value)
                    }
                    placeholder="Main description of your driving school..."
                  />
                </div>

                <div>
                  <Label htmlFor="aboutText2">Second Paragraph</Label>
                  <Textarea
                    id="aboutText2"
                    rows={4}
                    value={settings.homepageAboutText2 || ""}
                    onChange={(e) =>
                      handleInputChange("homepageAboutText2", e.target.value)
                    }
                    placeholder="Additional information about your services..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Homepage Statistics</CardTitle>
                    <CardDescription>
                      Configure the statistics displayed in the about section
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={refreshMetrics}
                      variant="outline"
                      size="sm"
                      disabled={loading}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Data
                    </Button>
                    <Button onClick={addNewStat} size="sm">
                      Add Statistic
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {settings.homepageStats?.map((stat: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Statistic {index + 1}</h4>
                        <Button
                          onClick={() => removeStat(index)}
                          variant="destructive"
                          size="sm"
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor={`icon-${index}`}>Icon</Label>
                          <select
                            id={`icon-${index}`}
                            className="w-full p-2 border rounded"
                            value={stat.icon}
                            onChange={(e) =>
                              handleStatChange(index, "icon", e.target.value)
                            }
                            aria-label={`Icon for statistic ${index + 1}`}
                          >
                            <option value="TrendingUp">Trending Up</option>
                            <option value="Users">Users</option>
                            <option value="Award">Award</option>
                            <option value="Star">Star</option>
                            <option value="Shield">Shield</option>
                            <option value="BookOpen">Book Open</option>
                          </select>
                        </div>

                        <div>
                          <Label>Value</Label>
                          <Input
                            value={stat.value}
                            onChange={(e) =>
                              handleStatChange(index, "value", e.target.value)
                            }
                            placeholder="95%"
                          />
                        </div>

                        <div>
                          <Label>Label</Label>
                          <Input
                            value={stat.label}
                            onChange={(e) =>
                              handleStatChange(index, "label", e.target.value)
                            }
                            placeholder="Success Rate"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Media Assets</CardTitle>
                <CardDescription>
                  Manage images and media for the about section
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">
                        Upload new about section image
                      </p>
                      <Button className="mt-2" variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500">
                    Current image: /images/3.jpeg
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Metrics</CardTitle>
                <CardDescription>
                  Live data from your driving school system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metrics ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Total Enrollments
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-blue-700 mt-1">
                        {metrics.totalEnrollments}
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900">
                          Active Students
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-green-700 mt-1">
                        {metrics.activeStudents}
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">
                          Pass Rate
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-purple-700 mt-1">
                        {metrics.passRate}%
                      </p>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">
                          Completed Courses
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-orange-700 mt-1">
                        {metrics.completedCourses}
                      </p>
                    </div>

                    <div className="p-4 bg-pink-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-pink-600" />
                        <span className="text-sm font-medium text-pink-900">
                          Avg Rating
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-pink-700 mt-1">
                        {metrics.avgRating.toFixed(1)}/5
                      </p>
                    </div>

                    <div className="p-4 bg-indigo-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-900">
                          Years Active
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-indigo-700 mt-1">
                        {metrics.yearsActive}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading metrics...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
