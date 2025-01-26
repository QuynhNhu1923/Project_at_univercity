import { RightOutlined, DownOutlined, SearchOutlined } from "@ant-design/icons";
import { Progress, Table, Input, Button, Space } from "antd";
import React, { useState } from "react";

function TableCustomTwo() {
    const [expandedRowKeys, setExpandedRowKeys] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [sortedInfo, setSortedInfo] = useState({});

    const toggleExpand = (key) => {
        setExpandedRowKeys((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const handleSearch = (e) => {
        setSearchText(e.target.value);
    };

    const handleSort = (sortKey) => {
        const order = sortedInfo.order === "ascend" ? "descend" : "ascend";
        setSortedInfo({ columnKey: sortKey, order });
    };

    const formatDate = (dateString) => {
        const options = { year: "numeric", month: "2-digit", day: "2-digit" };
        return new Date(dateString)
            .toLocaleDateString("en-GB", options)
            .replace(/\//g, "/");
    };

    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            filteredValue: [searchText],
            onFilter: (value, record) =>
                record.name.toLowerCase().includes(value.toLowerCase()),
            render: (text) => (
                <span className="name-column" title={text}>
                    {text}
                </span>
            ),
            width: "40%",
        },
        {
            title: "Progress",
            dataIndex: "progress",
            sorter: (a, b) => a.progressValue - b.progressValue,
            sortOrder: sortedInfo.columnKey === "progress" && sortedInfo.order,
            render: (_, record) => (
                <Progress
                    percent={record.progressValue}
                    size="small"
                    status={
                        record.status === "uncompleted" ? "normal" : "normal"
                    }
                    strokeColor={
                        record.status === "completed"
                            ? "#52c41a"
                            : record.status === "doing"
                            ? "blue"
                            : "#F31414"
                    }
                    format={() => `${record.progressValue}%`}
                />
            ),
            width: "20%",
        },
        {
            title: "Deadline",
            dataIndex: "deadline",
            sorter: (a, b) => new Date(a.deadline) - new Date(b.deadline),
            sortOrder: sortedInfo.columnKey === "deadline" && sortedInfo.order,
            render: (text) => formatDate(text),
            className: "ant-table-cell-deadline",
            width: "20%",
        },
        {
            title: "Priority",
            dataIndex: "prioritize",
            sorter: (a, b) => a.prioritize.localeCompare(b.prioritize),
            sortOrder:
                sortedInfo.columnKey === "prioritize" && sortedInfo.order,
            className: "ant-table-cell-prioritize",
            width: "15%",
        },
        {
            title: "",
            dataIndex: "expand",
            render: (_, record) => (
                <span
                    className="expand-icon"
                    onClick={() => toggleExpand(record.key)}
                >
                    {expandedRowKeys.includes(record.key) ? (
                        <DownOutlined />
                    ) : (
                        <RightOutlined />
                    )}
                </span>
            ),
            width: "20px",
        },
    ];

    const data = [
        {
            key: "7",
            name: "Tổ chức họp lớp định kỳ lớp sinh viên quản lý",
            progressValue: 0,
            deadline: "2024-06-30",
            prioritize: "Medium",
            description: "VIỆT NHẬT K66 (01-03), ICT K67 (01-03)",
            target: "6",
            unit: "lớp",
            achieved: "0",
            type: "Phục Vụ",
            status: "upcomming",
        },
        {
            key: "9",
            name: "Đánh giá và chấm điểm cho môn học Giao diện và trải nghiệm người dùng",
            progressValue: 0,
            deadline: "2024-08-01",
            prioritize: "High",
            description:
                "Đánh giá kết quả học tập của sinh viên qua các bài kiểm tra, bài tập lớn, chuyên cần của 3 lớp 147731, 147732, 147733",
            target: "3",
            unit: "lớp",
            achieved: "0",
            type: "Đánh giá học tập cho sinh viên",
            status: "upcomming",
        },
        {
            key: "10",
            name: "Đánh giá và chấm điểm cho môn học Kỹ thuật phần mềm",
            progressValue: 0,
            deadline: "2024-08-01",
            prioritize: "High",
            description:
                "Đánh giá kết quả học tập của sinh viên qua các bài kiểm tra, bài tập lớn, chuyên cần của 3 lớp 147749, 147750, 147751",
            target: "3",
            unit: "lớp",
            achieved: "0",
            type: "Đánh giá học tập cho sinh viên",
            status: "upcomming",
        },
        {
            key: "11",
            name: "Đánh giá và chấm điểm cho môn học Nhập môn công nghệ phần mềm",
            progressValue: 0,
            deadline: "2024-08-01",
            prioritize: "High",
            description:
                "Đánh giá kết quả học tập của sinh viên qua các bài kiểm tra, bài tập lớn, chuyên cần của 3 lớp 147743, 147744, 147745",
            target: "3",
            unit: "lớp",
            achieved: "0",
            type: "Đánh giá học tập cho sinh viên",
            status: "upcomming",
        }
    ];

    const expandedRowRender = (record) => {
        return (
            <div className="table-info">
                <p className="table-info-title">{record.name}</p>
                <div className="table-info-row">
                    <p>
                        {record.achieved} / {record.target} ({record.unit})
                    </p>
                    <p>
                        <strong>Deadline:</strong> {formatDate(record.deadline)}
                    </p>
                </div>
                <p>
                    <strong>Description:</strong> {record.description}
                </p>
                <p>
                    <strong>Progress Value:</strong> {record.progressValue}%
                </p>
            </div>
        );
    };

    const onChange = (pagination, filters, sorter, extra) => {
        setSortedInfo(sorter);
    };

    return (
        <div>
            <Space
                className="hihi"
                style={{
                    marginBottom: 16,
                    display: "flex",
                }}
            >
                <Input
                    placeholder="Search by name"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={handleSearch}
                    style={{ width: 200, marginBottom: 8 }}
                />
                <Button
                    onClick={() => handleSort("progress")}
                    style={{ marginBottom: 8 }}
                >
                    Sort by Progress
                </Button>
                <Button
                    onClick={() => handleSort("deadline")}
                    style={{ marginBottom: 8 }}
                >
                    Sort by Deadline
                </Button>
                <Button
                    onClick={() => handleSort("prioritize")}
                    style={{ marginBottom: 8 }}
                >
                    Sort by Priority
                </Button>
            </Space>
            <Table
                columns={columns}
                dataSource={data}
                onChange={onChange}
                expandable={{
                    expandedRowRender,
                    expandedRowKeys,
                    onExpand: (expanded, record) => toggleExpand(record.key),
                    expandIconColumnIndex: -1,
                }}
                pagination={{ pageSize: 5 }}
                scroll={{ x: "max-content" }}
            />
            <style>
                {`
                    .name-column {
                        display: block;
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                        width: 450px;
                    }
                    @media (max-width: 768px) {
                        .hihi {
                            flex-wrap: wrap;
                            gap: 5px;
                            align-items: flex-start;
                        }
                        .name-column {
                            max-width: 150px;
                        }
                        .expand-icon {
                            // margin-right: 10px;
                            display: inline-block;
                            width: 30px;
                        }
                        .ant-table-cell {
                            padding-right: 0px !important;
                            width: 100%;
                        }
                        .ant-table-cell-row-hover {
                            padding-right: 0px !important;
                            width: 100%;
                            .expand-icon {
                                padding: 0;
                            }
                        }
                        .ant-table-cell-deadline,
                        .ant-table-cell-prioritize {
                            display: none;
                        }
                    }
                    .expand-icon {
                        cursor: pointer;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .ant-table-row-expand-icon-cell {
                        text-align: center;
                    }
                    .table-info p{
                        // background-color: #f9f9f9;
                        // padding: 16px;
                        // border: 1px solid #e8e8e8;
                        // border-radius: 4px;
                        margin-bottom: 8px;
                    }
                    .table-info-title {
                        color: #010c80;
                        font-weight: 600;
                        margin-bottom: 8px;
                        font-size: 16px;
                    }
                    .table-info-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 8px;
                    }
                    .table-info-row p {
                        display: inline-block;
                        margin: 0;
                    }
                    @media (max-width: 768px) {
                        .table-info-row {
                            display: flex;
                            flex-direction: column;
                            // margin-bottom: 8px;
                        }
                        .table-info p {
                            width: calc(100vw - 60px);
                        }
                        .table-info {
                            width: calc(100vw - 60px);
                        }
                        .table-info-title {
                            font-size: 14px;
                        }
                    }
                `}
            </style>
        </div>
    );
}

export default TableCustomTwo;
