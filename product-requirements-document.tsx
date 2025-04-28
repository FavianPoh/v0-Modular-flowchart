"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileDown,
  FileText,
  Users,
  Workflow,
  BarChart4,
  Settings,
  Code,
  Layers,
  Sliders,
  Lightbulb,
  Gauge,
  Puzzle,
} from "lucide-react"

export default function ProductRequirementsDocument() {
  const [activeTab, setActiveTab] = useState("overview")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    "user-stories": false,
    features: false,
    technical: false,
    roadmap: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const downloadPRD = () => {
    // In a real application, this would generate a PDF or other document format
    alert("In a real application, this would download the PRD as a PDF or other document format.")
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Product Requirements Document</h1>
          <p className="text-xl text-muted-foreground">Modular Flowchart Application</p>
        </div>
        <Button onClick={downloadPRD} className="gap-2">
          <Download className="h-4 w-4" />
          Download PRD
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader className="bg-slate-50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Document Information</CardTitle>
              <CardDescription>Version 1.0 | Last Updated: April 28, 2024</CardDescription>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              DRAFT
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Project Name</p>
              <p>Modular Flowchart Application</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Document Owner</p>
              <p>Product Management Team</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p>Draft - For Review</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Target Release</p>
              <p>Q3 2024</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="user-stories" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> User Stories
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" /> Features
          </TabsTrigger>
          <TabsTrigger value="technical" className="flex items-center gap-2">
            <Code className="h-4 w-4" /> Technical
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="flex items-center gap-2">
            <BarChart4 className="h-4 w-4" /> Roadmap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Product Overview</CardTitle>
              <CardDescription>A high-level description of the Modular Flowchart application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Product Vision</h3>
                <p>
                  The Modular Flowchart application is a powerful visual programming and modeling tool that enables
                  users to create, connect, and analyze modular components in a flowchart interface. It allows for
                  real-time calculation, sensitivity analysis, and visualization of complex data flows and
                  relationships.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Problem Statement</h3>
                <p>
                  Traditional flowcharting and modeling tools often lack the ability to perform real-time calculations,
                  analyze sensitivities, and provide interactive feedback. Users need a more dynamic way to visualize
                  and manipulate data flows, especially for financial modeling, process optimization, and system design.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Target Users</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Financial analysts and modelers</li>
                  <li>Process engineers and system designers</li>
                  <li>Data scientists and analysts</li>
                  <li>Business intelligence professionals</li>
                  <li>Operations researchers</li>
                  <li>Educational institutions teaching modeling concepts</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Key Differentiators</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Real-time calculation and propagation of changes</li>
                  <li>Interactive sensitivity analysis</li>
                  <li>Modular design with expandable components</li>
                  <li>Visual representation of data flows and impacts</li>
                  <li>Customizable module creation and library</li>
                  <li>Code export capabilities</li>
                  <li>Heatmap visualization for impact analysis</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Success Metrics</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>User adoption rate and active user growth</li>
                  <li>Time spent creating and analyzing models</li>
                  <li>Number of modules created and saved</li>
                  <li>User satisfaction with analysis capabilities</li>
                  <li>Reduction in time to perform sensitivity analysis compared to traditional methods</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-stories" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>User Stories</CardTitle>
              <CardDescription>Key user stories and acceptance criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6">
                  {/* User Story 1 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-medium">Creating and Connecting Modules</h3>
                      <Badge className="bg-green-100 text-green-800">High Priority</Badge>
                    </div>
                    <p className="mb-3">
                      <span className="font-medium">As a</span> financial analyst,
                      <span className="font-medium"> I want to</span> create and connect calculation modules in a
                      flowchart,
                      <span className="font-medium"> so that</span> I can model complex financial scenarios visually.
                    </p>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Acceptance Criteria:</h4>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Users can add predefined modules from a library</li>
                        <li>Users can create custom modules with custom formulas</li>
                        <li>Modules can be connected via drag-and-drop</li>
                        <li>Connections visually represent data flow between modules</li>
                        <li>Module positions can be adjusted on the canvas</li>
                        <li>Modules display key information in collapsed state</li>
                      </ul>
                    </div>
                  </div>

                  {/* User Story 2 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-medium">Real-time Calculation</h3>
                      <Badge className="bg-green-100 text-green-800">High Priority</Badge>
                    </div>
                    <p className="mb-3">
                      <span className="font-medium">As a</span> data analyst,
                      <span className="font-medium"> I want to</span> see calculations update in real-time when I change
                      input values,
                      <span className="font-medium"> so that</span> I can immediately understand the impact of my
                      changes.
                    </p>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Acceptance Criteria:</h4>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Changes to input values propagate through the flowchart</li>
                        <li>Calculations update automatically or with a manual recalculate option</li>
                        <li>Visual indication when a module is calculating</li>
                        <li>Visual indication when a module needs recalculation</li>
                        <li>Performance is optimized for complex flowcharts</li>
                      </ul>
                    </div>
                  </div>

                  {/* User Story 3 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-medium">Module Expansion and Drilldown</h3>
                      <Badge className="bg-green-100 text-green-800">High Priority</Badge>
                    </div>
                    <p className="mb-3">
                      <span className="font-medium">As a</span> system designer,
                      <span className="font-medium"> I want to</span> expand modules to see details and drill down into
                      specific metrics,
                      <span className="font-medium"> so that</span> I can analyze components without cluttering my view.
                    </p>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Acceptance Criteria:</h4>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Modules can be expanded in place to show more details</li>
                        <li>Expanded modules show inputs, formula preview, and outputs</li>
                        <li>Detailed drilldown available through a dedicated button</li>
                        <li>Drilldown provides full editing capabilities</li>
                        <li>Expansion and drilldown are separate actions</li>
                      </ul>
                    </div>
                  </div>

                  {/* User Story 4 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-medium">Sensitivity Analysis</h3>
                      <Badge className="bg-green-100 text-green-800">High Priority</Badge>
                    </div>
                    <p className="mb-3">
                      <span className="font-medium">As a</span> business analyst,
                      <span className="font-medium"> I want to</span> perform sensitivity analysis on my models,
                      <span className="font-medium"> so that</span> I can understand how changes to inputs affect
                      overall outcomes.
                    </p>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Acceptance Criteria:</h4>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Users can select specific inputs for sensitivity analysis</li>
                        <li>Users can adjust input values by percentage</li>
                        <li>System shows impact on all affected modules</li>
                        <li>Results display percentage changes in outputs</li>
                        <li>Users can apply simulated changes to the actual model</li>
                        <li>Reset functionality to return to original values</li>
                      </ul>
                    </div>
                  </div>

                  {/* User Story 5 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-medium">Heatmap Visualization</h3>
                      <Badge className="bg-amber-100 text-amber-800">Medium Priority</Badge>
                    </div>
                    <p className="mb-3">
                      <span className="font-medium">As a</span> data scientist,
                      <span className="font-medium"> I want to</span> visualize the relative values of a specific metric
                      across all modules,
                      <span className="font-medium"> so that</span> I can quickly identify hotspots and patterns.
                    </p>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Acceptance Criteria:</h4>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Users can enable a heatmap mode for the flowchart</li>
                        <li>Users can select which metric to visualize</li>
                        <li>Modules are colored based on their relative metric values</li>
                        <li>A legend shows the color scale and min/max values</li>
                        <li>Heatmap can be toggled on/off</li>
                      </ul>
                    </div>
                  </div>

                  {/* User Story 6 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-medium">Code Export</h3>
                      <Badge className="bg-amber-100 text-amber-800">Medium Priority</Badge>
                    </div>
                    <p className="mb-3">
                      <span className="font-medium">As a</span> developer,
                      <span className="font-medium"> I want to</span> export my flowchart as executable code,
                      <span className="font-medium"> so that</span> I can integrate it into other applications.
                    </p>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Acceptance Criteria:</h4>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Users can export the entire flowchart as code</li>
                        <li>Code maintains the relationships between modules</li>
                        <li>Generated code is well-formatted and documented</li>
                        <li>Users can select the export format/language</li>
                        <li>Export includes all necessary functions and dependencies</li>
                      </ul>
                    </div>
                  </div>

                  {/* User Story 7 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-medium">Saving and Loading</h3>
                      <Badge className="bg-green-100 text-green-800">High Priority</Badge>
                    </div>
                    <p className="mb-3">
                      <span className="font-medium">As a</span> user,
                      <span className="font-medium"> I want to</span> save my flowcharts and load them later,
                      <span className="font-medium"> so that</span> I can continue my work across sessions.
                    </p>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Acceptance Criteria:</h4>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Flowcharts are automatically saved at regular intervals</li>
                        <li>Users can manually save flowcharts</li>
                        <li>Saved flowcharts include all module data and connections</li>
                        <li>Users can reset to initial state if needed</li>
                        <li>Visual indication of last save time</li>
                      </ul>
                    </div>
                  </div>

                  {/* User Story 8 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-medium">Module Library</h3>
                      <Badge className="bg-amber-100 text-amber-800">Medium Priority</Badge>
                    </div>
                    <p className="mb-3">
                      <span className="font-medium">As a</span> frequent user,
                      <span className="font-medium"> I want to</span> access a library of pre-built modules,
                      <span className="font-medium"> so that</span> I can quickly build common model patterns.
                    </p>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Acceptance Criteria:</h4>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Library contains categorized pre-built modules</li>
                        <li>Users can search and filter the library</li>
                        <li>Modules can be added to the flowchart from the library</li>
                        <li>Library includes description and purpose for each module</li>
                        <li>Common module types are available (math, logic, input, output, etc.)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Feature Specifications</CardTitle>
              <CardDescription>Detailed specifications for key features</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-8">
                  {/* Feature 1 */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-medium">Module System</h3>
                    </div>
                    <div className="pl-7 space-y-4">
                      <p>
                        The core of the application is a modular system that allows users to create, connect, and
                        manipulate calculation modules in a visual flowchart.
                      </p>

                      <div>
                        <h4 className="text-base font-medium mb-2">Module Types</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Purpose</TableHead>
                              <TableHead>Color Coding</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>Input</TableCell>
                              <TableCell>Provides initial values to the flowchart</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                  <span>Blue</span>
                                </div>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Math</TableCell>
                              <TableCell>Performs mathematical calculations</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                                  <span>Green</span>
                                </div>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Logic</TableCell>
                              <TableCell>Performs logical operations and conditionals</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                                  <span>Purple</span>
                                </div>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Filter</TableCell>
                              <TableCell>Filters data based on conditions</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 bg-amber-500 rounded"></div>
                                  <span>Amber</span>
                                </div>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Transform</TableCell>
                              <TableCell>Transforms data from one format to another</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 bg-indigo-500 rounded"></div>
                                  <span>Indigo</span>
                                </div>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Output</TableCell>
                              <TableCell>Represents final results or outputs</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 bg-rose-500 rounded"></div>
                                  <span>Rose</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Module Structure</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>
                            <span className="font-medium">Header:</span> Module name, type badge, and status indicators
                          </li>
                          <li>
                            <span className="font-medium">Content:</span> Description and key metrics preview
                          </li>
                          <li>
                            <span className="font-medium">Expandable Section:</span> Detailed inputs, formula, and
                            outputs
                          </li>
                          <li>
                            <span className="font-medium">Footer:</span> Action buttons (details, reset, delete)
                          </li>
                          <li>
                            <span className="font-medium">Connection Points:</span> Input and output handles for
                            connections
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Module Interactions</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Expand/collapse for viewing details in place</li>
                          <li>Quick edit mode for adjusting inputs</li>
                          <li>Drilldown for detailed editing and analysis</li>
                          <li>Drag to reposition on the canvas</li>
                          <li>Connect inputs and outputs between modules</li>
                          <li>Visual feedback for calculation status</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Workflow className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-medium">Flowchart Canvas</h3>
                    </div>
                    <div className="pl-7 space-y-4">
                      <p>The interactive canvas where users create and manipulate their modular flowcharts.</p>

                      <div>
                        <h4 className="text-base font-medium mb-2">Canvas Features</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Infinite canvas with pan and zoom capabilities</li>
                          <li>Snap-to-grid for precise module placement</li>
                          <li>Mini-map for navigation in complex flowcharts</li>
                          <li>Background grid for visual reference</li>
                          <li>Animated connections showing data flow direction</li>
                          <li>Selection and multi-selection of modules</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Toolbar</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Add module button</li>
                          <li>Connection management</li>
                          <li>Code export</li>
                          <li>Save/reset flowchart</li>
                          <li>Recalculate button with auto-recalculate toggle</li>
                          <li>Library access</li>
                          <li>Sensitivity analysis</li>
                          <li>Heatmap toggle</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Connection System</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Drag-and-drop connection creation</li>
                          <li>Named connection points for specific inputs/outputs</li>
                          <li>Visual indication of connection validity</li>
                          <li>Animated connections showing active data flow</li>
                          <li>Connection management panel for complex flowcharts</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sliders className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-medium">Sensitivity Analysis</h3>
                    </div>
                    <div className="pl-7 space-y-4">
                      <p>Tools for analyzing how changes to inputs affect outputs throughout the flowchart.</p>

                      <div>
                        <h4 className="text-base font-medium mb-2">Analysis Capabilities</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Select specific inputs for analysis</li>
                          <li>Adjust input values by percentage</li>
                          <li>Simulate changes without affecting the actual model</li>
                          <li>View impact on all affected modules</li>
                          <li>Percentage change visualization</li>
                          <li>Apply simulated changes to the model if desired</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Dashboard Interface</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Input change summary</li>
                          <li>Affected modules list</li>
                          <li>Most significant changes highlight</li>
                          <li>Expandable details for each affected module</li>
                          <li>Direct navigation to affected modules</li>
                          <li>Apply/cancel options for changes</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Integration with Module Drilldown</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Access sensitivity analysis from module details</li>
                          <li>Input-specific analysis options</li>
                          <li>Reset percentage slider</li>
                          <li>Input change visualization</li>
                          <li>Direct application of changes from drilldown</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Feature 4 */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart4 className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-medium">Visualization Tools</h3>
                    </div>
                    <div className="pl-7 space-y-4">
                      <p>Visual tools for understanding data relationships and impacts across the flowchart.</p>

                      <div>
                        <h4 className="text-base font-medium mb-2">Heatmap</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Color-coding of modules based on selected metric</li>
                          <li>Dynamic color scale based on min/max values</li>
                          <li>Legend showing color gradient and value range</li>
                          <li>Toggle for enabling/disabling heatmap</li>
                          <li>Metric selection for different visualizations</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Metric Drilldown</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Detailed analysis of specific metrics</li>
                          <li>Visualization of metric dependencies</li>
                          <li>Impact flow diagrams</li>
                          <li>Direct navigation to related modules</li>
                          <li>Historical value tracking</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Status Indicators</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Calculation status animation</li>
                          <li>"Needs update" indicators</li>
                          <li>Modified input highlighting</li>
                          <li>Connection activity visualization</li>
                          <li>Error state indicators</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Feature 5 */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Code className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-medium">Formula and Code System</h3>
                    </div>
                    <div className="pl-7 space-y-4">
                      <p>Tools for creating, editing, and exporting formulas and code.</p>

                      <div>
                        <h4 className="text-base font-medium mb-2">Formula Builder</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Visual formula construction</li>
                          <li>Input variable integration</li>
                          <li>Formula validation</li>
                          <li>Syntax highlighting</li>
                          <li>Error checking and suggestions</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Code Editor</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Raw code editing for advanced users</li>
                          <li>Function code preview</li>
                          <li>Syntax highlighting</li>
                          <li>Input/output mapping</li>
                          <li>Code validation</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Code Export</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Export entire flowchart as executable code</li>
                          <li>Multiple language/format options</li>
                          <li>Code preview before export</li>
                          <li>Documentation generation</li>
                          <li>Module dependency resolution</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Feature 6 */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-medium">Module Management</h3>
                    </div>
                    <div className="pl-7 space-y-4">
                      <p>Tools for creating, editing, and managing modules.</p>

                      <div>
                        <h4 className="text-base font-medium mb-2">Module Creation</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Add module dialog with type selection</li>
                          <li>Name and description fields</li>
                          <li>Input definition</li>
                          <li>Formula/function creation</li>
                          <li>Default values configuration</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Module Library</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Categorized pre-built modules</li>
                          <li>Search and filter functionality</li>
                          <li>Module previews</li>
                          <li>Drag-and-drop addition to flowchart</li>
                          <li>Custom module templates</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Module Details Panel</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Comprehensive module editing</li>
                          <li>Multiple tabs for different aspects (overview, inputs, formula, outputs, explanation)</li>
                          <li>Input management with grouping by affected metrics</li>
                          <li>Formula editing with visual builder and code view</li>
                          <li>Sensitivity analysis tools</li>
                          <li>Save/reset functionality</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Feature 7 */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Gauge className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-medium">Performance Optimization</h3>
                    </div>
                    <div className="pl-7 space-y-4">
                      <p>Features ensuring the application performs well with complex flowcharts.</p>

                      <div>
                        <h4 className="text-base font-medium mb-2">Calculation Optimization</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Selective recalculation of affected modules</li>
                          <li>Dependency tracking for efficient updates</li>
                          <li>Auto-recalculate toggle for user control</li>
                          <li>Debounced updates to prevent cascading renders</li>
                          <li>Asynchronous calculation for UI responsiveness</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Rendering Optimization</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Virtualized rendering for large flowcharts</li>
                          <li>Memoization of stable components</li>
                          <li>Lazy loading of complex features</li>
                          <li>Throttled UI updates</li>
                          <li>Optimized canvas rendering</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Storage Optimization</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Efficient data serialization</li>
                          <li>Debounced auto-save</li>
                          <li>Circular reference handling</li>
                          <li>Optimized local storage usage</li>
                          <li>Incremental updates</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Feature 8 */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Puzzle className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-medium">Connection Management</h3>
                    </div>
                    <div className="pl-7 space-y-4">
                      <p>Tools for managing connections between modules.</p>

                      <div>
                        <h4 className="text-base font-medium mb-2">Connection Panel</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Visual connection management interface</li>
                          <li>Source and target module selection</li>
                          <li>Input/output mapping</li>
                          <li>Connection deletion</li>
                          <li>Connection validation</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Connection Visualization</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Animated connections showing data flow</li>
                          <li>Direction indicators</li>
                          <li>Connection highlighting on hover</li>
                          <li>Visual feedback for active connections</li>
                          <li>Error indication for invalid connections</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Connection Interaction</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Drag-and-drop connection creation</li>
                          <li>Click-to-delete functionality</li>
                          <li>Reconnection of existing connections</li>
                          <li>Multi-connection selection</li>
                          <li>Connection routing optimization</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Technical Specifications</CardTitle>
              <CardDescription>Technical details and architecture</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-8">
                  {/* Technical Section 1 */}
                  <div>
                    <h3 className="text-xl font-medium mb-4">Technology Stack</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-base font-medium mb-2">Frontend</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>React with Next.js (App Router)</li>
                          <li>TypeScript for type safety</li>
                          <li>Tailwind CSS for styling</li>
                          <li>shadcn/ui for UI components</li>
                          <li>ReactFlow for flowchart visualization</li>
                          <li>Lucide React for icons</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">State Management</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>React hooks for component state</li>
                          <li>ReactFlow hooks for flowchart state</li>
                          <li>Local storage for persistence</li>
                          <li>Refs for performance optimization</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Performance Optimizations</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Memoization with useCallback and useMemo</li>
                          <li>Debounced updates and saves</li>
                          <li>Asynchronous calculations</li>
                          <li>Selective recalculation</li>
                          <li>Virtualized rendering</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Technical Section 2 */}
                  <div>
                    <h3 className="text-xl font-medium mb-4">Architecture</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-base font-medium mb-2">Component Structure</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>ModularFlowchart: Main container component</li>
                          <li>FlowChart: Inner component with ReactFlow integration</li>
                          <li>ModuleNode: Custom node component for modules</li>
                          <li>ModuleDetails: Detailed editing panel</li>
                          <li>SensitivityDashboard: Analysis interface</li>
                          <li>Various utility and UI components</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Data Flow</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Nodes and edges stored in ReactFlow state</li>
                          <li>Module data stored in node.data property</li>
                          <li>Calculations performed with Function objects created from code strings</li>
                          <li>Changes propagate through connected modules based on edge definitions</li>
                          <li>State updates trigger recalculation when needed</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Module Structure</h4>
                        <pre className="bg-slate-100 p-3 rounded-md text-xs overflow-x-auto">
                          {`// Module data structure
{
  id: string,
  type: "moduleNode",
  position: { x: number, y: number },
  data: {
    label: string,
    description: string,
    type: "input" | "math" | "logic" | "filter" | "transform" | "output",
    inputs: Record<string, any>,
    outputs: Record<string, any>,
    defaultInputs: Record<string, any>,
    function: Function,
    functionCode: string,
    isUserAdded: boolean,
    needsRecalculation: boolean,
    onDelete: (nodeId: string) => void,
    onCancel: (nodeId: string) => void,
    onUpdateInputs: (nodeId: string, inputs: Record<string, any>) => void,
    onRecalculate: (nodeId: string) => void,
    onSaveDefaults: (nodeId: string) => void
  }
}`}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Technical Section 3 */}
                  <div>
                    <h3 className="text-xl font-medium mb-4">Calculation Engine</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-base font-medium mb-2">Function Execution</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Functions created from string code using Function constructor</li>
                          <li>Inputs passed as arguments to functions</li>
                          <li>Outputs returned as objects</li>
                          <li>Error handling for invalid functions</li>
                          <li>Sandboxed execution environment</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Recalculation Logic</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Topological sorting of nodes based on dependencies</li>
                          <li>Selective recalculation of affected nodes</li>
                          <li>Propagation of changes through connected nodes</li>
                          <li>Cycle detection and handling</li>
                          <li>Optimization for large flowcharts</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Sensitivity Analysis Algorithm</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Deep cloning of nodes to simulate changes</li>
                          <li>Modification of selected input by percentage</li>
                          <li>Recalculation of affected nodes</li>
                          <li>Comparison of original and new outputs</li>
                          <li>Calculation of percentage changes</li>
                          <li>Sorting and highlighting of significant changes</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Technical Section 4 */}
                  <div>
                    <h3 className="text-xl font-medium mb-4">Storage and Persistence</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-base font-medium mb-2">Local Storage</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Flowchart data stored in browser's localStorage</li>
                          <li>Automatic saving at regular intervals</li>
                          <li>Manual save option</li>
                          <li>Serialization of nodes and edges</li>
                          <li>Function code stored as strings</li>
                          <li>Circular reference handling</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Data Format</h4>
                        <pre className="bg-slate-100 p-3 rounded-md text-xs overflow-x-auto">
                          {`// Storage data structure
{
  nodes: Node[],  // ReactFlow nodes with module data
  edges: Edge[],  // ReactFlow edges defining connections
  timestamp: number  // Last save timestamp
}`}
                        </pre>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Save Optimization</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Debounced saves to prevent excessive writes</li>
                          <li>Cleanup of circular references</li>
                          <li>Function objects converted to strings</li>
                          <li>Timestamp tracking for last save</li>
                          <li>Silent auto-saves vs. manual saves with notification</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Technical Section 5 */}
                  <div>
                    <h3 className="text-xl font-medium mb-4">UI/UX Considerations</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-base font-medium mb-2">Accessibility</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Keyboard navigation support</li>
                          <li>ARIA attributes for interactive elements</li>
                          <li>Color contrast compliance</li>
                          <li>Screen reader support</li>
                          <li>Focus management</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">Responsive Design</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Mobile-friendly interface</li>
                          <li>Adaptive layouts</li>
                          <li>Touch interaction support</li>
                          <li>Viewport-aware sizing</li>
                          <li>Device detection for optimized experience</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-base font-medium mb-2">User Feedback</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Toast notifications for actions</li>
                          <li>Loading indicators</li>
                          <li>Animation for state changes</li>
                          <li>Error messages and validation</li>
                          <li>Confirmation dialogs for destructive actions</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Development Roadmap</CardTitle>
              <CardDescription>Planned features and enhancements</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-8">
                  {/* Phase 1 */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-green-100 text-green-800">Current Phase</Badge>
                      <h3 className="text-xl font-medium">Phase 1: Core Functionality</h3>
                    </div>
                    <div className="space-y-3 pl-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Module System</h4>
                          <p className="text-sm text-muted-foreground">
                            Basic module types, connections, and calculations
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Flowchart Canvas</h4>
                          <p className="text-sm text-muted-foreground">Interactive canvas with node manipulation</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Module Details</h4>
                          <p className="text-sm text-muted-foreground">Detailed view and editing of modules</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Calculation Engine</h4>
                          <p className="text-sm text-muted-foreground">Function execution and propagation</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Local Storage</h4>
                          <p className="text-sm text-muted-foreground">Basic save and load functionality</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Module Expansion</h4>
                          <p className="text-sm text-muted-foreground">Expandable modules with in-place editing</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Sensitivity Analysis</h4>
                          <p className="text-sm text-muted-foreground">Basic impact analysis for input changes</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 2 */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-blue-100 text-blue-800">Next Phase</Badge>
                      <h3 className="text-xl font-medium">Phase 2: Enhanced Visualization and Analysis</h3>
                    </div>
                    <div className="space-y-3 pl-4">
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Advanced Heatmap</h4>
                          <p className="text-sm text-muted-foreground">
                            Enhanced heatmap with multiple metrics and customization
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Multi-parameter Sensitivity</h4>
                          <p className="text-sm text-muted-foreground">
                            Analyze changes to multiple inputs simultaneously
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Visual Impact Flow</h4>
                          <p className="text-sm text-muted-foreground">
                            Graphical representation of impact propagation
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Metric Grouping</h4>
                          <p className="text-sm text-muted-foreground">Organize and categorize metrics for analysis</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Threshold Settings</h4>
                          <p className="text-sm text-muted-foreground">Define thresholds for impact significance</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Batch Analysis</h4>
                          <p className="text-sm text-muted-foreground">Run multiple sensitivity analyses in batch</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Analysis Export</h4>
                          <p className="text-sm text-muted-foreground">Export sensitivity analysis results</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 3 */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-purple-100 text-purple-800">Future Phase</Badge>
                      <h3 className="text-xl font-medium">Phase 3: Collaboration and Advanced Features</h3>
                    </div>
                    <div className="space-y-3 pl-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Real-time Collaboration</h4>
                          <p className="text-sm text-muted-foreground">Multiple users working on the same flowchart</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Version Control</h4>
                          <p className="text-sm text-muted-foreground">Track changes and revert to previous versions</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Module Templates</h4>
                          <p className="text-sm text-muted-foreground">Create and share reusable module templates</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Cloud Storage</h4>
                          <p className="text-sm text-muted-foreground">
                            Store flowcharts in the cloud with sharing options
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Advanced Import/Export</h4>
                          <p className="text-sm text-muted-foreground">Import from and export to various formats</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">API Integration</h4>
                          <p className="text-sm text-muted-foreground">Connect to external data sources via API</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Scenario Comparison</h4>
                          <p className="text-sm text-muted-foreground">Compare multiple scenarios side by side</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Advanced Visualization</h4>
                          <p className="text-sm text-muted-foreground">3D visualization and interactive charts</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 4 */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-slate-100 text-slate-800">Long-term Vision</Badge>
                      <h3 className="text-xl font-medium">Phase 4: Enterprise Features and Ecosystem</h3>
                    </div>
                    <div className="space-y-3 pl-4">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-5 w-5 text-slate-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Enterprise Authentication</h4>
                          <p className="text-sm text-muted-foreground">SSO, RBAC, and enterprise security features</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-5 w-5 text-slate-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">AI-assisted Modeling</h4>
                          <p className="text-sm text-muted-foreground">AI suggestions for model improvements</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-5 w-5 text-slate-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Module Marketplace</h4>
                          <p className="text-sm text-muted-foreground">Community sharing and marketplace for modules</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-5 w-5 text-slate-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Advanced Analytics</h4>
                          <p className="text-sm text-muted-foreground">
                            Machine learning integration for predictive modeling
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-5 w-5 text-slate-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Workflow Automation</h4>
                          <p className="text-sm text-muted-foreground">Trigger actions based on flowchart conditions</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-5 w-5 text-slate-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Mobile App</h4>
                          <p className="text-sm text-muted-foreground">
                            Native mobile applications for on-the-go access
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-5 w-5 text-slate-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Plugin System</h4>
                          <p className="text-sm text-muted-foreground">Extensible architecture for custom plugins</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Implementation Timeline */}
                  <div>
                    <h3 className="text-xl font-medium mb-4">Implementation Timeline</h3>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                      <div className="space-y-8 relative">
                        <div className="pl-12 relative">
                          <div className="absolute left-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-green-600"></div>
                          </div>
                          <div>
                            <h4 className="font-medium">Q2 2024</h4>
                            <p className="text-sm text-muted-foreground">Phase 1 completion and initial release</p>
                            <ul className="list-disc pl-6 text-sm mt-2">
                              <li>Core functionality stable</li>
                              <li>Basic sensitivity analysis</li>
                              <li>Module expansion and drilldown separation</li>
                            </ul>
                          </div>
                        </div>
                        <div className="pl-12 relative">
                          <div className="absolute left-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                          </div>
                          <div>
                            <h4 className="font-medium">Q3-Q4 2024</h4>
                            <p className="text-sm text-muted-foreground">Phase 2 implementation</p>
                            <ul className="list-disc pl-6 text-sm mt-2">
                              <li>Enhanced visualization tools</li>
                              <li>Advanced sensitivity analysis</li>
                              <li>Performance optimizations</li>
                            </ul>
                          </div>
                        </div>
                        <div className="pl-12 relative">
                          <div className="absolute left-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                          </div>
                          <div>
                            <h4 className="font-medium">Q1-Q2 2025</h4>
                            <p className="text-sm text-muted-foreground">Phase 3 implementation</p>
                            <ul className="list-disc pl-6 text-sm mt-2">
                              <li>Collaboration features</li>
                              <li>Cloud storage integration</li>
                              <li>Advanced import/export</li>
                            </ul>
                          </div>
                        </div>
                        <div className="pl-12 relative">
                          <div className="absolute left-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-slate-600"></div>
                          </div>
                          <div>
                            <h4 className="font-medium">Q3 2025 and beyond</h4>
                            <p className="text-sm text-muted-foreground">Phase 4 and future development</p>
                            <ul className="list-disc pl-6 text-sm mt-2">
                              <li>Enterprise features</li>
                              <li>AI integration</li>
                              <li>Ecosystem development</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Document Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Product Manager</p>
              <p>Pending Approval</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Engineering Lead</p>
              <p>Pending Approval</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Design Lead</p>
              <p>Pending Approval</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">Last updated: April 28, 2024</p>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Print
            </Button>
            <Button className="gap-2">
              <FileDown className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
