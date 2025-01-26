import React, { useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { useDispatch, useSelector } from "react-redux";
import { Progress, Row, Col, Button, InputNumber, Tour, Spin } from "antd";
import Calendar from "react-calendar";
import { Slide } from "react-slideshow-image";
import "react-slideshow-image/dist/styles.css";
import moment from "moment";
import all_imgs from "../../assets/img/all_img";
import all_icons from "./../../assets/icon/all_icon";

import './Dashboard.scss'

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { helpClose } from "../../actions/Help";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const labels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

const data = {
    labels,
    datasets: [
        {
            label: "Giảng dạy",
            data: [0, 10, 20, 40, 50, 60, 70],
            borderColor: "#1356f2",
            backgroundColor: "#1356f2",
        },
        {
            label: "Sinh hoạt",
            data: [0, 15, 15, 30, 45, 50, 60],
            borderColor: "#6013f2",
            backgroundColor: "#6013f2",
        },
        {
            label: "Nghiên cứu",
            data: [0, 20, 10, 50, 60, 70, 75],
            borderColor: "#a913f2",
            backgroundColor: "#a913f2",
        },
    ],
};

const slideImages = [
    {
        url: "http://t1.gstatic.com/licensed-image?q=tbn:ANd9GcR0NrOJEpfjkM0zxD-aO9b-bWqW3mhY57jPMg3aSbxTYO__R4jOvx8T2Oa7Fm9yxXOGg4B_ns3SZaZGCiBOPQw",
        caption: "Slide 1",
        title: "Giảng dạy",
        currentKPI: "70",
        lastKPI: "60",
    },
    {
        url: "http://t1.gstatic.com/licensed-image?q=tbn:ANd9GcR0NrOJEpfjkM0zxD-aO9b-bWqW3mhY57jPMg3aSbxTYO__R4jOvx8T2Oa7Fm9yxXOGg4B_ns3SZaZGCiBOPQw",
        caption: "Slide 2",
        title: "Sinh hoạt",
        currentKPI: "60",
        lastKPI: "50",
    },
    {
        url: "http://t1.gstatic.com/licensed-image?q=tbn:ANd9GcR0NrOJEpfjkM0zxD-aO9b-bWqW3mhY57jPMg3aSbxTYO__R4jOvx8T2Oa7Fm9yxXOGg4B_ns3SZaZGCiBOPQw",
        caption: "Slide 3",
        title: "Nghiên cứu",
        currentKPI: "75",
        lastKPI: "70",
    },
];

const options = {
    responsive: true,
    plugins: {
        legend: {
            position: "bottom",
            labels: {
                color: "#000",
                font: {
                    size: 14,
                    family: "Inter, sans-serif",
                },
            },
        },
    },
    scales: {
        y: {
            min: 0,
            max: 100,
        },
    },
};

const divStyle = {
    padding: "20px 40px",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "40px",
    height: "190px",
    backgroundSize: "cover",
};

const Dashboard = () => {
    const dispatch = useDispatch();
    const open = useSelector((state) => state.helpReducer);
    const [date, setDate] = useState(new Date());
    const [editingTaskIndex, setEditingTaskIndex] = useState(null);
    const [loading, setLoading] = useState(false);

    const [tasks, setTasks] = useState({
        "2024-05-20": [
            { task: "Task 1", current: 50, desire: 80 },
            { task: "Task 2", current: 30, desire: 60 },
        ],
        "2024-05-21": [
            { task: "Task 3", current: 80, desire: 90 },
            { task: "Task 4", current: 20, desire: 40 },
        ],
        "2024-05-22": [
            { task: "Task 5", current: 10, desire: 30 },
            { task: "Task 6", current: 40, desire: 70 },
        ],
        "2024-05-23": [
            { task: "Task 7", current: 25, desire: 50 },
            { task: "Task 8", current: 60, desire: 80 },
        ],
        "2024-05-24": [
            { task: "Task 9", current: 75, desire: 90 },
            { task: "Task 10", current: 50, desire: 80 },
        ],
        "2024-05-31": [
            { task: "Tổ chức hội thảo khoa học tại Lab", current: 0, desire: 30 },
        ],
    });

    const [tasksImport, setTasksImport] = useState({
        "2024-05-29": [
            { task: "Giảng dạy môn Kỹ thuật phần mềm", import: "qldt", done: true },
        ],
        "2024-05-03": [
            { task: "Tham gia hội nghị chuyên môn", import: "qldt", done: true },
        ],
        "2024-06-05": [
            { task: "Giảng dạy môn Kỹ Thuật Phần Mềm", import: "qldt", done: true },
            { task: "Giảng dạy môn UIUX", import: "qldt", done: false },
        ],
	    "2024-06-07": [
            { task: "Tham gia hội thảo trực tuyến", import: "qldt", done: true },
            { task: "Giảng dạy môn UIUX", import: "qldt", done: false },
        ],
    });

    const [tempPercentage, setTempPercentage] = useState(null);

    const handleTaskChange = (value) => {
        setTempPercentage(value);
    };

    const handleSaveTask = (dateString, index) => {
        setTasks((prevTasks) => {
            const newTasks = { ...prevTasks };
            newTasks[dateString][index].current = tempPercentage;
            return newTasks;
        });
        setEditingTaskIndex(null);
    };

    const handleEditTask = (index, currentPercentage) => {
        setEditingTaskIndex(index);
        setTempPercentage(currentPercentage);
    };

    const selectedDateString = moment.utc(date).add(1,'day').format("YYYY-MM-DD");

    const selectedTasks = tasks[selectedDateString] || [];
    const selectedImportTasks = tasksImport[selectedDateString] || [];

    const tileClassName = ({ date, view }) => {
        if (view === "month") {
            const dateString = moment.utc(date).add(1,'day').format("YYYY-MM-DD");
            const dayTasks = tasks[dateString] || [];
            const importTasks = tasksImport[dateString] || [];

            // Combine both tasks and importTasks
            const allTasks = [...dayTasks, ...importTasks];

            const currentDate = new Date();
            const isPastDate =
                date < currentDate &&
                date.toDateString() !== currentDate.toDateString();

            const allTasksCompleted = allTasks.every((task) => {
                if ("current" in task && "desire" in task) {
                    // For tasks with current and desire properties
                    return task.current >= task.desire;
                }
                // For imported tasks with done property
                return task.done;
            });

            if (isPastDate && !allTasksCompleted) {
                return "react-calendar__tile--hasIncompletePrevTasks";
            }
            if (!isPastDate && allTasks.length > 0 && !allTasksCompleted) {
                return "react-calendar__tile--hasTasks";
            }
        }
        return null;
    };

    // const handleShowStatus = () => {

    //     setLoading(true);
    //     setTimeout(() => {
    //         setLoading(false);
    //     }, 2000);
    // };
    const handleShowStatus = () => {
        // Find the task index first to ensure it exists before setting loading state
        const taskIndex = tasksImport["2024-06-07"].findIndex(
            task => task.task === "Giảng dạy môn UIUX"
        );

        if (taskIndex !== -1) {
            setLoading(true);
            setTimeout(() => {
                // Clone the previous state
                const newTasksImport = { ...tasksImport };

                // Update the specific task's done status
                newTasksImport["2024-06-07"][taskIndex].done = true;

                // Update the state
                setTasksImport(newTasksImport);
                setLoading(false);
            }, 2000);
        }
    };

    const ref1 = useRef(null);
    const ref2 = useRef(null);
    const ref3 = useRef(null);
    const ref4 = useRef(null);

    const steps = [
        {
            title: "Biểu đồ theo dõi tiến độ KPI.",
            description: "Bạn có thể xem tiến độ hoàn thành KPI ở đây nè!.",
            target: () => ref1.current,
        },
        {
            title: "Biểu đồ tròn",
            description: "Bạn có thể theo dõi tất cả các tiến độ của KPI.",
            target: () => ref2.current,
        },
        {
            title: "Lịch",
            description: "Giúp bạn xem công việc hôm nay cũng như công việc của ngày hôm trước.",
            target: () => ref3.current,
        },
        {
            title: "Cập nhật nhiệm vụ",
            description: "Giúp bạn cập nhật công việc 1 cách dễ dàng hơn nhờ vào những tổ chức , doanh nghiệp mà chúng tôi đã liên kết.",
            cover: [
                <img
                    key="image1"
                    alt="tour1.png"
                    src={all_icons.qldt}
                    style={{ width: 40, height: 60, objectFit: 'contain',marginRight: '15px' }}
                />,
                <img
                    key="image2"
                    alt="tour2.png"
                    src={all_icons.quizlet}
                    style={{ width: 40, height: 60, objectFit: 'contain',marginRight: '15px' }}
                />,
                <img
                    key="image2"
                    alt="tour2.png"
                    src={all_icons.schooler}
                    style={{ width: 40, height: 60, objectFit: 'contain',marginRight: '15px' }}
                />
            ],
            target: () => ref4.current,
        }
    ];
    
    return (
        <div className="dashboard custom-container">
            <Row>
                <h1 className="dashboard-title">Dashboard</h1>
            </Row>
            <Row gutter={40} style={{ marginBottom: "0" }}>
                <Col className="gutter-row" xs={24} md={12}>
                    <Row>
                        <div className="dashboard-hello">
                            <div>
                                <p>Hello, Ms. Giang!</p>
                                <p>
                                    This week you've increased{" "}
                                    <strong>5%</strong> KPI
                                </p>
                                <p>Keep up the good work !!!</p>
                            </div>
                            <img src={all_imgs.hello} alt="" />
                        </div>
                    </Row>
                    <Row>
                        <div className="kpi-diagram" ref={ref1}>
                            <h2 className="kpi-diagram-title">
                                Monthly KPI Progress
                            </h2>
                            <Line
                                options={{
                                    ...options,
                                    maintainAspectRatio: false,
                                }}
                                data={data}
                                height="130.5px"
                                minWidth="100px"
                            />
                        </div>
                    </Row>
                    <Row>
                        <div ref={ref2} style={{ width: "100%" }}>
                            <Slide>
                                {slideImages.map((slideImage, index) => (
                                    <div key={index}>
                                        <div
                                            style={{
                                                ...divStyle,
                                                backgroundImage: (`url(${slideImage.url}`),
                                            }}
                                        >
                                            <h2 className="slide-name">
                                                Curent KPI
                                            </h2>
                                            <div className="slide-container">
                                                <Progress
                                                    type="circle"
                                                    strokeColor="#6664f2"
                                                    percent={
                                                        slideImage.currentKPI
                                                    }
                                                    success={{
                                                        percent:
                                                            slideImage.lastKPI,
                                                        strokeColor: "#1713f2",
                                                    }}
                                                    strokeWidth={12}
                                                    size={100}
                                                    format={(percent) => (
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    "18px",
                                                                fontWeight:
                                                                    "bold",
                                                                color: "#1814F2",
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            {percent}%
                                                        </span>
                                                    )}
                                                />
                                                <div className="kpi-box-info">
                                                    <span>KPI:</span>
                                                    <h3 className="kpi-box-info-title">
                                                        {slideImage.title}
                                                    </h3>
                                                    <span>INFO: </span>
                                                    <p>
                                                        Increase by{" "}
                                                        <strong>
                                                            {slideImage.currentKPI -
                                                                slideImage.lastKPI}
                                                            %
                                                        </strong>{" "}
                                                        compared to last month.
                                                    </p>
                                                    <p></p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </Slide>
                        </div>
                    </Row>
                </Col>
                <Col className="gutter-row" xs={24} md={12}>
                    <Row>
                        <div className="dashboard-calendar" ref={ref3}>
                            <Calendar
                                onChange={setDate}
                                value={date}
                                tileClassName={tileClassName}
                            />
                        </div>
                    </Row>
                    <Row style={{ width: "100%" }} ref={ref4}>
                        <div className="dashboard-daytask">
                            <div className="dashboard-daytask-title">
                                <h3>Recent tasks for {selectedDateString}</h3>
                                <button onClick={handleShowStatus}>
                                    <img
                                        src={all_icons.load}
                                        alt="load-icon"
                                        className="load-icon"
                                    />
                                </button>
                            </div>
                            <div className="dashboard-list">
                                {selectedTasks.length === 0 &&
                                selectedImportTasks.length === 0 ? (
                                    <p>No tasks for this day.</p>
                                ) : (
                                    <>
                                        {selectedTasks.map((task, index) => (
                                            <div
                                                key={index}
                                                className={`dashboard-task ${
                                                    task.current >= task.desire
                                                        ? "completed"
                                                        : ""
                                                }`}
                                            >
                                                <div className="task-info">
                                                    <span className="task-info-name">
                                                        {task.task}
                                                    </span>
                                                    <span>
                                                        <InputNumber
                                                            className={`custom-input-number ${
                                                                editingTaskIndex !==
                                                                index
                                                                    ? "non-editable"
                                                                    : "editable"
                                                            }`}
                                                            min={0}
                                                            max={100}
                                                            value={
                                                                editingTaskIndex ===
                                                                index
                                                                    ? tempPercentage
                                                                    : task.current
                                                            }
                                                            disabled={
                                                                editingTaskIndex !==
                                                                index
                                                            }
                                                            onChange={
                                                                handleTaskChange
                                                            }
                                                        />
                                                        /&nbsp;&nbsp;&nbsp;&nbsp;
                                                        {task.desire}
                                                    </span>
                                                </div>
                                                {editingTaskIndex === index ? (
                                                    <Button
                                                        type="primary"
                                                        onClick={() =>
                                                            handleSaveTask(
                                                                selectedDateString,
                                                                index
                                                            )
                                                        }
                                                    >
                                                        Save
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="default"
                                                        onClick={() =>
                                                            handleEditTask(
                                                                index,
                                                                task.current
                                                            )
                                                        }
                                                    >
                                                        Update
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        {selectedImportTasks.map(
                                            (importTask, index) => (
                                                <div
                                                    key={index}
                                                    className={`dashboard-task ${
                                                        importTask.done
                                                            ? "completed"
                                                            : ""
                                                    }`}
                                                >
                                                    <div className="task-info">
                                                        <span className="task-info-name">
                                                            {importTask.task}
                                                        </span>
                                                        <span className="span-import">
                                                            &nbsp;&nbsp;&nbsp;Import:&nbsp;&nbsp;
                                                        </span>
                                                        {importTask.import ===
                                                        "schooler" ? (
                                                            <img
                                                                src={
                                                                    all_icons.schooler
                                                                }
                                                                alt="task-info-img"
                                                            />
                                                        ) : importTask.import ===
                                                          "quizlet" ? (
                                                            <img
                                                                src={
                                                                    all_icons.quizlet
                                                                }
                                                                alt="task-info-img"
                                                            />
                                                        ) : (
                                                            <img
                                                                src={
                                                                    all_icons.qldt
                                                                }
                                                                alt="task-info-img"
                                                            />
                                                        )}
                                                        {/* <img src={all_icons} alt="task-info-img" /> */}
                                                    </div>
                                                    {loading ? (
                                                        <Spin />
                                                    ) : (
                                                        <span>
                                                            {importTask.done
                                                                ? "Completed"
                                                                : "Not completed"}
                                                        </span>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </Row>
                </Col>
            </Row>
            <Tour
                open={open}
                steps={steps}
                onClose={() => dispatch(helpClose())}
            />
        </div>
    );
};

export default Dashboard;