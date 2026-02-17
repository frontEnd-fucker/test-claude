"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Calendar, ChevronUp, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { useTimelineData } from "@/lib/queries/tasks";
import { taskKeys } from "@/lib/queries/tasks";
import { cn } from "@/lib/utils";

// 静态组件定义
const ChartLoadingState = () => (
  <div className="h-[180px] flex items-center justify-center text-gray-500">
    Loading chart...
  </div>
);

// 动态导入图表库以减少初始包大小
const Scatter = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Scatter),
  {
    ssr: false,
    loading: ChartLoadingState,
  }
);

// Chart.js 类型导入（仅用于类型检查）
import type {
  Chart,
  ChartEvent,
  ActiveElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";

// 静态 JSX 组件提取（减少重新创建）
const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="h-[400px] flex items-center justify-center border border-red-200 bg-red-50 rounded-lg">
    <div className="text-center">
      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
      <p className="text-red-700">Failed to load timeline data</p>
      <button
        onClick={onRetry}
        className="mt-2 px-4 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
      >
        Retry
      </button>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="h-[180px] flex items-center justify-center">
    <div className="text-center">
      <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
      <p className="text-gray-600">No tasks with due dates</p>
      <p className="text-sm text-gray-500 mt-1">
        Create tasks and set due dates to see them on the timeline
      </p>
    </div>
  </div>
);


// 自定义 plugin：绘制当前时间的垂直线
const todayLinePlugin = {
  id: "todayLine",
  afterDraw: (chart: Chart) => {
    const ctx = chart.ctx;
    const xAxis = chart.scales.x;
    const yAxis = chart.scales.y;

    // 获取当前时间戳
    const now = new Date().getTime();
    const x = xAxis.getPixelForValue(now);

    // 绘制垂直线
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, yAxis.top);
    ctx.lineTo(x, yAxis.bottom);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#f59e0b"; // 琥珀色
    ctx.setLineDash([5, 5]); // 虚线
    ctx.stroke();

    // 绘制"现在"标签
    ctx.fillStyle = "#f59e0b";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Now", x, yAxis.top - 5);
    ctx.restore();
  },
};

// 自定义 plugin：绘制聚合点（圆形中间有三小圆点）
interface AggregatedPointPluginArgs {
  meta: {
    data: Array<{
      getProps(keys: string[]): { x: number; y: number };
      options: { radius?: number };
    }>;
  };
  index: number;
}

type PointElementType = AggregatedPointPluginArgs['meta']['data'][0];

const aggregatedPointPlugin = {
  id: "aggregatedPoint",
  afterDatasetDraw: (chart: Chart, args: AggregatedPointPluginArgs, _options: unknown) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    const ctx = chart.ctx;
    const meta = args.meta;
    const dataset = chart.data.datasets[args.index];

    // 只处理空标签的数据集（聚合点）
    if (dataset.label !== "") return;

    meta.data.forEach((pointElement: PointElementType, index: number) => {
      const rawData = dataset.data[index] as CustomChartDataPoint;
      if (!rawData || rawData.type !== "aggregated") return;

      const { x, y } = pointElement.getProps(['x', 'y']);
      const radius = pointElement.options.radius || 12;

      ctx.save();

      // 绘制外圆
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#6b7280"; // 灰色
      ctx.fill();

      // 绘制三个小圆点（水平居中排列）
      const dotRadius = radius * 0.2; // 小圆点的半径
      const horizontalSpacing = radius * 0.5; // 水平间距

      ctx.fillStyle = "#ffffff"; // 白色小圆点

      // 三个点的水平位置：左、中、右
      const dotPositions = [
        { x: x - horizontalSpacing, y: y }, // 左
        { x: x, y: y }, // 中
        { x: x + horizontalSpacing, y: y }, // 右
      ];

      dotPositions.forEach((pos) => {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    });
  },
};

interface TimelineTask {
  id: string;
  title: string;
  dueDate: string;
  status: "todo" | "in-progress" | "complete";
  x?: number;
  y?: number;
}

interface AggregatedPoint {
  type: "aggregated";
  date: string;
  count: number;
  tasks: TimelineTask[];
  x: number;
  y: number;
}

interface ProjectTimelineProps {
  projectId?: string;
}

type TimelinePoint = TimelineTask | AggregatedPoint;

// Type guard
function isAggregatedPoint(point: TimelinePoint): point is AggregatedPoint {
  return (point as AggregatedPoint).type === "aggregated";
}

// Custom Chart.js data point type
interface CustomChartDataPoint {
  x: number;
  y: number;
  type?: "aggregated";
  date?: string;
  count?: number;
  tasks?: TimelineTask[];
  id?: string;
  title?: string;
  dueDate?: string;
  status?: "todo" | "in-progress" | "complete";
}

// 解析日期字符串为本地时间戳
const parseLocalDate = (dateStr: string): number => {
  const [year, month, day] = dateStr.split("-").map(Number);
  // 注意：月份是0-based，所以month-1
  return new Date(year, month - 1, day).getTime();
};

// Format date as "MMM d" (e.g., "Feb 20")
const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return format(date, 'MMM d');
};

// 使用Map提高状态查找性能
const statusColorsMap = new Map([
  ['todo', '#ef4444'], // 红色
  ['in-progress', '#3b82f6'], // 蓝色
  ['complete', '#22c55e'], // 绿色
]);

const statusLabelsMap = new Map([
  ['todo', 'Todo'],
  ['in-progress', 'In Progress'],
  ['complete', 'Complete'],
]);

// 向后兼容的辅助函数
const getStatusColor = (status: 'todo' | 'in-progress' | 'complete'): string =>
  statusColorsMap.get(status) || '#6b7280';

const getStatusLabel = (status: 'todo' | 'in-progress' | 'complete'): string =>
  statusLabelsMap.get(status) || 'Unknown';

export default function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const [isChartInitialized, setIsChartInitialized] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<TimelinePoint | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const MAX_VISIBLE_TASKS_IN_TOOLTIP = 5;
  const queryClient = useQueryClient();
  const {
    data: timelineData,
    isLoading,
    error,
  } = useTimelineData(projectId);

  const tasks = useMemo(() => timelineData?.timelineTasks || [], [timelineData]);
  const noDueDateTasks = useMemo(() => timelineData?.noDueDateTasks || [], [timelineData]);
  const totalTasks = tasks.length + noDueDateTasks.length;

  // Expand/collapse state with localStorage persistence
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('timeline-expanded');
        return saved === null ? true : saved === 'true'; // 默认展开
      } catch {
        return true; // 如果localStorage不可用，默认展开
      }
    }
    return true;
  });

  // 动态初始化 Chart.js
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeChartJS = async () => {
      try {
        // 动态导入 Chart.js 及其依赖
        const chartJSModule = await import("chart.js");
        const { Chart, CategoryScale, LinearScale, PointElement, Tooltip, Legend, TimeScale } = chartJSModule;

        // 动态导入日期适配器
        await import("chartjs-adapter-date-fns");

        // 注册 Chart.js 组件和自定义插件
        Chart.register(
          CategoryScale,
          LinearScale,
          TimeScale,
          PointElement,
          Tooltip,
          Legend,
          todayLinePlugin,
          aggregatedPointPlugin
        );

        setIsChartInitialized(true);
      } catch (error) {
        console.error("Failed to initialize Chart.js:", error);
      }
    };

    initializeChartJS();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('timeline-expanded', isExpanded.toString());
      } catch {
        // 忽略localStorage错误
      }
    }
  }, [isExpanded]);


  const chartData = useMemo(() => {
    const MAX_VISIBLE_PER_DAY = 6; // 每天最多显示6个点，第6个是聚合点
    const SPACING = 0.35;

    // 按日期排序
    const sortedTasks = [...tasks].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

    // 按日期分组
    const tasksByDate = sortedTasks.reduce((acc, task) => {
      if (!acc[task.dueDate]) {
        acc[task.dueDate] = [];
      }
      acc[task.dueDate].push(task);
      return acc;
    }, {} as Record<string, TimelineTask[]>);

    // 处理每个日期的任务，生成要显示的点
    const pointsToShow: TimelinePoint[] = [];

    Object.entries(tasksByDate).forEach(([date, tasks]) => {
      const totalTasks = tasks.length;

      if (totalTasks <= MAX_VISIBLE_PER_DAY) {
        // 任务数量少，全部显示
        tasks.forEach((task, index) => {
          pointsToShow.push({
            ...task,
            y: index * SPACING,
          });
        });
      } else {
        // 任务数量多，显示前 MAX_VISIBLE_PER_DAY-1 个任务 + 1个聚合点
        const visibleTasks = tasks.slice(0, MAX_VISIBLE_PER_DAY - 1);
        const remainingTasks = tasks.slice(MAX_VISIBLE_PER_DAY - 1);

        // 添加普通任务点
        visibleTasks.forEach((task, index) => {
          pointsToShow.push({
            ...task,
            y: index * SPACING,
          });
        });

        // 添加聚合点
        pointsToShow.push({
          type: "aggregated",
          date,
          count: remainingTasks.length,
          tasks: remainingTasks,
          x: parseLocalDate(date),
          y: (MAX_VISIBLE_PER_DAY - 1) * SPACING,
        });
      }
    });

    // 按状态分组普通任务点，聚合点单独一组
    const groupedByStatus = pointsToShow.reduce(
      (acc, point) => {
        if (isAggregatedPoint(point)) {
          if (!acc.aggregated) {
            acc.aggregated = [];
          }
          acc.aggregated.push(point);
        } else {
          if (!acc[point.status]) {
            acc[point.status] = [];
          }
          acc[point.status].push(point);
        }
        return acc;
      },
      {} as Record<string, TimelinePoint[]>,
    );

    // 为每个状态创建数据集
    const datasets = Object.entries(groupedByStatus).map(([status, points]) => {
      if (status === "aggregated") {
        return {
          label: "", // 空字符串，不在图例中显示
          data: points.map((point) => ({
            x: point.x,
            y: point.y,
            ...point,
          })),
          backgroundColor: "transparent", // 透明，由插件绘制
          borderColor: "transparent",
          pointRadius: 12,
          pointHoverRadius: 16,
          pointStyle: "circle" as const, // 圆形，但透明，由插件绘制实际图形
        };
      } else {
        return {
          label: getStatusLabel(status as 'todo' | 'in-progress' | 'complete'),
          data: points.map((point) => ({
            x: parseLocalDate((point as TimelineTask).dueDate),
            y: point.y,
            ...point,
          })),
          backgroundColor: getStatusColor(status as 'todo' | 'in-progress' | 'complete'),
          borderColor: getStatusColor(status as 'todo' | 'in-progress' | 'complete'),
          pointRadius: 10,
          pointHoverRadius: 14,
        };
      }
    });

    // 计算最大 y 值
    const maxY = pointsToShow.reduce((max, point) => Math.max(max, point.y || 0), 0);

    return { datasets, maxY, pointsToShow };
  }, [tasks]);

  // 动态生成 x 轴范围（基于实际任务日期）
  const { minDate, maxDate } = useMemo(() => {
    const dates = tasks
      .filter(task => task.dueDate)
      .map(task => new Date(task.dueDate).getTime());

    if (dates.length === 0) {
      // 默认范围：当前日期前后7天
      const now = new Date();
      const defaultMin = new Date(now.setDate(now.getDate() - 7)).getTime();
      const defaultMax = new Date(now.setDate(now.getDate() + 14)).getTime(); // 总共21天范围
      return {
        minDate: defaultMin,
        maxDate: defaultMax,
      };
    }

    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);

    // 添加缓冲期（3天）
    const buffer = 3 * 24 * 60 * 60 * 1000;
    return {
      minDate: minDate - buffer,
      maxDate: maxDate + buffer,
    };
  }, [tasks]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "time" as const,
          position: "bottom" as const,
          time: {
            unit: "day" as const,
            round: "day" as const,
            displayFormats: {
              day: "MMM d",
            },
          },
          min: minDate,
          max: maxDate,
          ticks: {
            color: "#9ca3af",
            callback: (tickValue: string | number) => {
              // 使用本地时间转换日期
              const numericValue = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue;
              const date = new Date(numericValue);
              const year = date.getFullYear();
              const month = date.getMonth() + 1;
              const day = date.getDate();
              const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              return formatDate(dateStr);
            },
          },
          grid: {
            color: "#374151",
            tickLength: 0,
          },
        },
        y: {
          display: false,
          min: 0,
          max: Math.max(1.4, chartData.maxY + 0.4),
        },
      },
      plugins: {
        legend: {
          position: "bottom" as const,
          align: "end" as const,
          labels: {
            color: "#d1d5db",
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          enabled: false, // 禁用 Chart.js 原生 tooltip，使用自定义悬停面板
        },
      },
      onHover: (event: ChartEvent, elements: ActiveElement[]) => {
        if (elements.length > 0) {
          // Chart.js内部属性访问需要类型断言
          const elementWithContext = elements[0] as ActiveElement & { element: { $context?: { raw: TimelinePoint } } };
          const point = elementWithContext.element.$context?.raw;
          if (point) {
            // 获取鼠标位置
            const nativeEvent = (event as ChartEvent & { native: MouseEvent }).native;
            if (nativeEvent) {
              const target = nativeEvent.target as HTMLElement;
              const rect = target.getBoundingClientRect();
              const containerWidth = rect.width;
              const containerHeight = rect.height;
              const mouseX = nativeEvent.clientX - rect.left;
              const mouseY = nativeEvent.clientY - rect.top;

              // 面板尺寸估计
              const panelWidth = 320;
              const panelHeight = 240;
              const offset = 10;

              // 计算初始位置（鼠标右下方）
              let left = mouseX + offset;
              let top = mouseY + offset;

              // 调整水平位置：防止右侧溢出
              if (left + panelWidth > containerWidth) {
                left = mouseX - panelWidth - offset;
              }

              // 调整垂直位置：防止底部溢出
              if (top + panelHeight > containerHeight) {
                top = mouseY - panelHeight - offset;
              }

              // 确保位置在容器内
              left = Math.max(0, Math.min(left, containerWidth - panelWidth));
              top = Math.max(0, Math.min(top, containerHeight - panelHeight));

              setMousePosition({ x: left, y: top });
            }
            setHoveredPoint(point);
          }
        } else {
          setHoveredPoint(null);
          setMousePosition(null);
        }
      },
    }),
    [chartData.maxY, minDate, maxDate],
  );

  return (
    <>
      {isLoading ? (
        <div className="h-[400px] bg-gray-50 animate-pulse rounded-lg" />
      ) : error ? (
        <ErrorState onRetry={() => queryClient.refetchQueries({ queryKey: taskKeys.timeline(projectId) })} />
      ) : (
        <div className="space-y-6">
      {/* Timeline chart card */}
      <div className={cn(
        "rounded-xl border bg-card p-4 shadow-sm",
        "transition-all duration-300 ease-in-out overflow-hidden",
        isExpanded ? "h-auto" : "h-[72px]"
      )}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-neon-cyan" />
            Project Timeline
          </h2>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {totalTasks === 0 ? '0 tasks' : `${totalTasks} task${totalTasks !== 1 ? 's' : ''}${noDueDateTasks.length > 0 ? ` (${noDueDateTasks.length} without due dates)` : ' (all with due dates)'}`}
            </span>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Expand
                </>
              )}
            </button>
          </div>
        </div>

        {isExpanded ? (
          // 展开状态
          <>
            <div className="relative h-[180px]">
              <Scatter data={{ datasets: chartData.datasets }} options={options} />

              {/* Custom hover tooltip */}
              {hoveredPoint && mousePosition && (
                <div
                  className="absolute bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg z-10"
                  style={{
                    backgroundColor: "#1f2937",
                    left: `${mousePosition.x}px`,
                    top: `${mousePosition.y}px`,
                    maxWidth: "320px",
                    maxHeight: "240px",
                    overflow: "hidden",
                  }}
                >
                  {isAggregatedPoint(hoveredPoint) ? (
                    <>
                      <p className="font-medium text-white">
                        📊 {hoveredPoint.count} more tasks
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatDate(hoveredPoint.date)}
                      </p>
                      <div className="mt-2 space-y-1 overflow-y-auto" style={{ maxHeight: "160px" }}>
                        {(() => {
                          const aggregated = hoveredPoint;
                          const allTasks = aggregated.tasks;
                          const totalTasks = allTasks.length;

                          if (totalTasks <= MAX_VISIBLE_TASKS_IN_TOOLTIP) {
                            // 全部显示
                            return allTasks.map((task) => (
                              <div key={task.id} className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: getStatusColor(task.status) }}
                                />
                                <span className="text-sm text-gray-300 truncate">
                                  {task.title}
                                </span>
                              </div>
                            ));
                          } else {
                            // 显示前 N 个任务 + 省略号
                            const visibleTasks = allTasks.slice(0, MAX_VISIBLE_TASKS_IN_TOOLTIP);
                            const remainingCount = totalTasks - MAX_VISIBLE_TASKS_IN_TOOLTIP;

                            return (
                              <>
                                {visibleTasks.map((task) => (
                                  <div key={task.id} className="flex items-center gap-2">
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: getStatusColor(task.status) }}
                                    />
                                    <span className="text-sm text-gray-300 truncate">
                                      {task.title}
                                    </span>
                                  </div>
                                ))}
                                <div className="flex items-center gap-2 pt-1 border-t border-gray-700 mt-1">
                                  <div className="w-2 h-2 rounded-full bg-gray-600" />
                                  <span className="text-sm text-gray-400 italic">
                                    {remainingCount} more tasks not shown...
                                  </span>
                                </div>
                              </>
                            );
                          }
                        })()}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-white">{hoveredPoint.title}</p>
                      <p className="text-sm text-gray-400">
                        {formatDate(hoveredPoint.dueDate)}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: getStatusColor(hoveredPoint.status) }}
                      >
                        {getStatusLabel(hoveredPoint.status)}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {tasks.length === 0 && <EmptyState />}

          </>
        ) : (
          // 收起状态：不显示任何额外内容，只有标题栏
          null
        )}
      </div>

        </div>
      )}
    </>
  );
}
