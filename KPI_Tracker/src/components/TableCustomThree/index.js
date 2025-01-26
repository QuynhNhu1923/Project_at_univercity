import { RightOutlined, DownOutlined, SearchOutlined } from "@ant-design/icons";
import { Progress, Table, Input, Button, Space } from "antd";
import React, { useState } from "react";

function TableCustomThree() {
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
            key: "1",
            name: "Chuẩn bị bài giảng cho môn Giao diện và trải nghiệm người dùng",
            progressValue: 100,
            deadline: "2024-02-01",
            prioritize: "High",
            description:
                "Soạn tài liệu học liệu, soạn bài giảng, soạn các bài tập hướng dẫn thực hành",
            target: "20",
            unit: "bài",
            achieved: "20",
            type: "Giảng dạy",
            status: "completed",
        },
        {
            key: "2",
            name: "Tham gia hoạt động nghiên cứu trực tuyến ",
            progressValue: 100,
            deadline: "2024-05-25",
            prioritize: "Medium",
            description:
                "Tham gia qua Microsort Teams. Thời gian: 14h00-17h30. Link tham gia: LINK",
            target: "1",
            unit: "ngày",
            achieved: "1",
            type: "Nghiên Cứu",
            status: "completed",
        },
        {
            key: "4",
            name: "Tham gia tư vấn tuyển sinh cho Đại học Bách Khoa",
            progressValue: 100,
            deadline: "2023-05-10",
            prioritize: "Medium",
            description:
                "Địa điểm: Sân ngã ba, Thời gian:9h30-12h00 ngày 2023-05-10",
            target: "1",
            unit: "ngày",
            achieved: "1",
            type: "Phục Vụ",
            status: "completed",
        },
        {
            key: "6",
            name: "Chuẩn bị tài liệu giảng dạy cho môn học Kỹ thuật phần mềm",
            progressValue: 100,
            deadline: "2024-02-02",
            prioritize: "High",
            description: "Soạn đề bài bài tập lớn, Slide",
            target: "25",
            unit: "bài",
            achieved: "25",
            type: "Giảng dạy",
            status: "completed",
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

export default TableCustomThree;
