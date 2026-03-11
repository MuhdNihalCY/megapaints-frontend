import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../utils/api";
import SmallLabel from "../../components/SmallLabel";

const PrintLabel = () => {
    const { fileNo } = useParams();
    const [labelData, setLabelData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!fileNo) return;
        setError(null);
        api.get(`/print-label/${fileNo}`)
            .then((res) => setLabelData(res.data))
            .catch((err) => {
                setError(
                    err?.response?.data?.message ||
                        err?.message ||
                        "Failed to load label data"
                );
            });
    }, [fileNo]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    if (!labelData) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <p>Loading...</p>
            </div>
        );
    }

    return <SmallLabel data={labelData} />;
};

export default PrintLabel;
