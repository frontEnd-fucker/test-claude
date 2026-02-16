"use client";

import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { useMemo, useState } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  Tooltip,
  Legend,
);

// 自定义 plugin：绘制当前时间的垂直线
const todayLinePlugin = {
  id: "todayLine",
  afterDraw: (chart: any) => {
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
    ctx.fillText("现在", x, yAxis.top - 5);
    ctx.restore();
  },
};

// 自定义 plugin：绘制聚合点（圆形中间有三小圆点）
const aggregatedPointPlugin = {
  id: "aggregatedPoint",
  afterDatasetDraw: (chart: any, args: any, options: any) => {
    const ctx = chart.ctx;
    const meta = args.meta;
    const dataset = chart.data.datasets[args.index];

    // 只处理空标签的数据集（聚合点）
    if (dataset.label !== "") return;

    meta.data.forEach((pointElement: any, index: number) => {
      const rawData = dataset.data[index];
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  Tooltip,
  Legend,
  todayLinePlugin,
  aggregatedPointPlugin,
);

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

type TimelinePoint = TimelineTask | AggregatedPoint;

// 解析日期字符串为本地时间戳
const parseLocalDate = (dateStr: string): number => {
  const [year, month, day] = dateStr.split("-").map(Number);
  // 注意：月份是0-based，所以month-1
  return new Date(year, month - 1, day).getTime();
};

// 格式化日期为 "M月D日" 格式
const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${month}月${day}日`;
};
const mockTasks: TimelineTask[] = [
  { id: "1", title: "完成需求文档", dueDate: "2026-02-10", status: "complete" },
  {
    id: "2",
    title: "设计数据库架构",
    dueDate: "2026-02-12",
    status: "complete",
  },
  { id: "3", title: "创建用户表", dueDate: "2026-02-12", status: "complete" },
  {
    id: "4",
    title: "设计商品表",
    dueDate: "2026-02-12",
    status: "in-progress",
  },
  {
    id: "5",
    title: "设计数据库架构",
    dueDate: "2026-02-15",
    status: "in-progress",
  },
  {
    id: "6",
    title: "开发登录API",
    dueDate: "2026-02-15",
    status: "in-progress",
  },
  { id: "7", title: "开发注册API", dueDate: "2026-02-15", status: "todo" },
  { id: "8", title: "开发用户认证模块", dueDate: "2026-02-18", status: "todo" },
  // 2月20日 - 12个任务
  { id: "9", title: "API 接口开发", dueDate: "2026-02-20", status: "todo" },
  {
    id: "10",
    title: "前端页面开发",
    dueDate: "2026-02-20",
    status: "in-progress",
  },
  { id: "11", title: "购物车功能开发", dueDate: "2026-02-20", status: "todo" },
  {
    id: "12",
    title: "用户界面设计",
    dueDate: "2026-02-20",
    status: "complete",
  },
  {
    id: "13",
    title: "后端API开发",
    dueDate: "2026-02-20",
    status: "in-progress",
  },
  { id: "14", title: "数据库优化", dueDate: "2026-02-20", status: "todo" },
  { id: "15", title: "集成测试", dueDate: "2026-02-20", status: "todo" },
  { id: "16", title: "性能测试", dueDate: "2026-02-20", status: "in-progress" },
  { id: "17", title: "安全审计", dueDate: "2026-02-20", status: "todo" },
  { id: "18", title: "文档编写", dueDate: "2026-02-20", status: "complete" },
  { id: "19", title: "部署配置", dueDate: "2026-02-20", status: "todo" },
  { id: "20", title: "监控设置", dueDate: "2026-02-20", status: "in-progress" },
  // 其他日期的任务
  { id: "21", title: "集成测试", dueDate: "2026-02-22", status: "todo" },
  { id: "22", title: "性能优化", dueDate: "2026-02-22", status: "todo" },
  { id: "23", title: "部署上线", dueDate: "2026-02-25", status: "todo" },
];

const statusColors = {
  todo: "#ef4444", // 红色
  "in-progress": "#3b82f6", // 蓝色
  complete: "#22c55e", // 绿色
};

const statusLabels = {
  todo: "待处理",
  "in-progress": "进行中",
  complete: "已完成",
};

export default function ProjectTimeline() {
  const [hoveredPoint, setHoveredPoint] = useState<TimelinePoint | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const MAX_VISIBLE_TASKS_IN_TOOLTIP = 5;

  const chartData = useMemo(() => {
    const MAX_VISIBLE_PER_DAY = 6; // 每天最多显示6个点，第6个是聚合点
    const SPACING = 0.35;

    // 按日期排序
    const sortedTasks = [...mockTasks].sort(
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
        if (point.type === "aggregated") {
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
          label: statusLabels[status as keyof typeof statusLabels],
          data: points.map((point) => ({
            x: parseLocalDate((point as TimelineTask).dueDate),
            y: point.y,
            ...point,
          })),
          backgroundColor: statusColors[status as keyof typeof statusColors],
          borderColor: statusColors[status as keyof typeof statusColors],
          pointRadius: 10,
          pointHoverRadius: 14,
        };
      }
    });

    // 计算最大 y 值
    const maxY = pointsToShow.reduce((max, point) => Math.max(max, point.y), 0);

    return { datasets, maxY, pointsToShow };
  }, []);

  // 生成 x 轴范围（增加偏移空间）
  const minDate = parseLocalDate("2026-02-05");
  const maxDate = parseLocalDate("2026-03-01");

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "time" as const,
          position: "bottom" as const,
          time: {
            unit: "day",
            round: "day",
            displayFormats: {
              day: "M月d日",
            },
          },
          min: minDate,
          max: maxDate,
          ticks: {
            color: "#9ca3af",
            callback: (value) => {
              // 使用本地时间转换日期
              const date = new Date(value);
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
      onHover: (event: any, elements: any) => {
        if (elements.length > 0) {
          const point = elements[0].element.$context?.raw as TimelinePoint;
          if (point) {
            // 获取鼠标位置
            if (event.native) {
              const rect = event.native.target.getBoundingClientRect();
              const containerWidth = rect.width;
              const containerHeight = rect.height;
              const mouseX = event.native.clientX - rect.left;
              const mouseY = event.native.clientY - rect.top;

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
    [chartData.maxY],
  );

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-neon-cyan" />
          项目时间线
        </h2>
        <span className="text-sm text-muted-foreground">
          共 {mockTasks.length} 个任务
        </span>
      </div>

      <div className="relative h-[180px]">
        <Scatter data={{ datasets: chartData.datasets }} options={options} />

        {/* 自定义 hover 提示 */}
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
            {hoveredPoint.type === "aggregated" ? (
              <>
                <p className="font-medium text-white">
                  📊 还有 {(hoveredPoint as AggregatedPoint).count} 个任务
                </p>
                <p className="text-sm text-gray-400">
                  {formatDate((hoveredPoint as AggregatedPoint).date)}
                </p>
                <div className="mt-2 space-y-1 overflow-y-auto" style={{ maxHeight: "160px" }}>
                  {(() => {
                    const aggregated = hoveredPoint as AggregatedPoint;
                    const allTasks = aggregated.tasks;
                    const totalTasks = allTasks.length;

                    if (totalTasks <= MAX_VISIBLE_TASKS_IN_TOOLTIP) {
                      // 全部显示
                      return allTasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: statusColors[task.status] }}
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
                                style={{ backgroundColor: statusColors[task.status] }}
                              />
                              <span className="text-sm text-gray-300 truncate">
                                {task.title}
                              </span>
                            </div>
                          ))}
                          <div className="flex items-center gap-2 pt-1 border-t border-gray-700 mt-1">
                            <div className="w-2 h-2 rounded-full bg-gray-600" />
                            <span className="text-sm text-gray-400 italic">
                              还有 {remainingCount} 个任务未显示...
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
                <p className="font-medium text-white">{(hoveredPoint as TimelineTask).title}</p>
                <p className="text-sm text-gray-400">
                  {formatDate((hoveredPoint as TimelineTask).dueDate)}
                </p>
                <p
                  className="text-sm"
                  style={{ color: statusColors[(hoveredPoint as TimelineTask).status] }}
                >
                  {statusLabels[(hoveredPoint as TimelineTask).status]}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
