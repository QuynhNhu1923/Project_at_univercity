import { Breadcrumb, Progress, Row, Col, Collapse } from "antd";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import React, { useEffect, useState } from "react";
import { getKpi } from "../../services/kpiService";

const { Panel } = Collapse;

const data = [
    {
        name: "John Doe",
        score: 85,
        completion: "75%",
        details: "Detail info for John Doe",
    },
    {
        name: "Jane Smith",
        score: 92,
        completion: "90%",
        details: "Detail info for Jane Smith",
    },
    {
        name: "Alice Johnson",
        score: 78,
        completion: "60%",
        details: "Detail info for Alice Johnson",
    },
];

function KpiDetail() {
    const location = useLocation();
    const { state } = location;
    const [type, setType] = useState(null);
    console.log(state);

    useEffect(() => {
        const fetchKpiType = async () => {
            try {
                const typeData = await getKpi(state.typeId);
                setType(typeData);
            } catch (error) {
                console.error("Error fetching KPI type:", error);
            }
        };

        if (state?.typeId) {
            fetchKpiType();
        }
    }, [state?.typeId]);

    if (!state) {
        return <div>Error: No KPI data available</div>;
    }

    const breadcrumbStyle = {
        marginBottom: "20px",
        marginTop: "25px",
        cursor: "pointer",
    };

    return (
        <div className="custom-container" style={{ padding: "0 20px" }}>
            <Breadcrumb separator=">" style={breadcrumbStyle}>
                <Breadcrumb.Item>
                    <Link to="/manage-kpi">Manage KPI</Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <Link to={`/manage-kpi/${state.typeId}`} state={type}>
                        {type ? type.name : "Loading..."}
                    </Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>{state.name}</Breadcrumb.Item>
            </Breadcrumb>
            <div className="kpi-detail">
                <Row gutter={40} className="kpi-detail-header">
                    <Col className="gutter-row kpi-detail-info" xs={24} md={12}>
                        <h1 className="kpi-detail-title">{state.name}</h1>
                        <div className="kpi-detail-complete">
                            Complete: <strong>42/60</strong>
                        </div>
                        <div className="kpi-detail-deadline">
                            Deadline: <strong>31/5/2023</strong> (5 days left)
                        </div>
                        <button className="kpi-detail-btn">
                            Report{" "}
                            <FontAwesomeIcon icon={faArrowRight} className="icon" />
                        </button>
                    </Col>
                    <Col className="gutter-row kpi-detail-progress" xs={24} md={12}>
                        <Progress
                            type="circle"
                            trailColor="#9B9AF9"
                            strokeColor="#1814F2"
                            percent={70}
                            strokeWidth={12}
                            size={180}
                            format={(percent) => (
                                <span
                                    style={{
                                        fontSize: "18px",
                                        fontWeight: "bold",
                                        color: "#1814F2",
                                        textAlign: "center",
                                    }}
                                >
                                    {percent}%
                                </span>
                            )}
                        />
                    </Col>
                </Row>
                <Row gutter={40} className="kpi-detail-criterion">
                    <Col className="gutter-row" xs={24}>
                        <Row>
                            <h2 className="kpi-detail-criterion-title">Criterions list</h2>
                        </Row>
                        <Row style={{ padding: "12px 40px 12px 16px" }} gutter={5}>
                            <Col span={5} className="kpi-detail-table-name">Name of criterion</Col>
                            <Col span={5} className="kpi-detail-table-name">Current</Col>
                            <Col span={5} className="kpi-detail-table-name">Goal</Col>
                            <Col span={5} className="kpi-detail-table-name">Unit</Col>
                            <Col span={4} className="kpi-detail-table-name">Weight</Col>
                        </Row>
                        <Collapse defaultActiveKey={["1"]} expandIconPosition="right">
                            {state.target.map((item, index) => (
                                <Panel
                                    header={
                                        <Row gutter={5}>
                                            <Col span={5}>{item.name}</Col>
                                            <Col span={5}>{item.current}</Col>
                                            <Col span={5}>{item.goal}</Col>
                                            <Col span={5}>{item.unit}</Col>
                                            <Col span={4}>{item.weight}</Col>
                                        </Row>
                                    }
                                    key={index + 1}
                                >
                                    <div>
                                        <p>Last update at: 10:00 06/07/2024</p>
                                    </div>
                                </Panel>
                            ))}
                        </Collapse>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

export default KpiDetail;
