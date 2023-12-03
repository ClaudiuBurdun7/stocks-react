import {useEffect, useState} from "react";
import axios from "axios";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    Tooltip,
    XAxis,
    YAxis,
    ResponsiveContainer,
} from "recharts";
import {Button, Select, Spin} from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import "./Chart.scss";

const { Option } = Select;

export default function Chart() {
    const [stockData, setStockData] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState("");
    const [loading,setLoading] = useState(false);
    const [error, setError] = useState(false)
    const apiKey = 'zI5UFpV3NTVkmxk0CY9bV5AlB4b9mOsI';

    const getCompanies = () => {
        setLoading(true)
        axios
            .get('https://api.polygon.io/v3/reference/tickers', {
                params: {
                    market: 'stocks',
                    active: true,
                    limit: 6,
                    apiKey: apiKey,
                },
            })
            .then((response) => {
                if (response.data && response.data.results) {
                    setError(false)
                    setCompanies(response.data.results);
                    setSelectedCompany(response.data.results[0]?.ticker || "");
                } else {
                    console.error('Invalid API data', response);
                    setError(true)
                }
                setLoading(false)

            })
            .catch((error) => {
                console.error('Failed to fetch data', error);
                setError(error)
                setLoading(false)
            });
    };

    const getStocks = (ticker) => {
        setLoading(true)
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const twoYearsAgo = currentYear - 2;

        axios
            .get(`https://api.polygon.io/v2/aggs/ticker/${ticker}/range/5/day/${twoYearsAgo}-01-01/${currentYear}-12-31`, {
                params: {
                    adjusted: true,
                    sort: 'asc',
                    limit: 5000,
                    apiKey: apiKey,
                },
            })
            .then((response) => {
                if (response.data && response.data.results) {
                    setStockData(response.data.results);
                    setError(false)
                } else {
                    console.error('Invalid API data', response);
                    setError(true)
                }
                setLoading(false)
            })
            .catch((error) => {
                console.error('Failed to fetch data', error);
                setError(true)
                setLoading(false)
            });
    };

    // Fetch companies only once when component mount
    useEffect(() => {
        getCompanies();
    }, []);

    // Fetch stock data whenever selected company changes
    useEffect(() => {
        if (selectedCompany) {
            getStocks(selectedCompany);
        }
    }, [selectedCompany]);

    // function to parse miliseconds timestamp to a readable date and to build the final data for chart
    const formatChartData = () => {
        const formattedData = stockData.map((data) => {
            const date = new Date(data.t);
            return {
                date: date.getFullYear(),
                result: data.c,
            };
        });
        return formattedData;
    };

    if(loading) {
        return <Spin
            indicator={
                <LoadingOutlined
                    style={{
                        fontSize: 24,
                    }}
                    spin
                />
            }
        />
    }

    if(error)  {
        return <div>
            <h2>There is an error with data fetching..</h2>
            <h4>Please try to reload the page later</h4>
            <Button onClick={ ()=>window.location.reload()} type='primary'>Reload data</Button>
        </div>
    }

    return (
        <div>
            <div className={'selectCompany'}>
                <span>Please select a company</span>
                <Select
                    value={selectedCompany}
                    onChange={(value) => setSelectedCompany(value)}
                >
                    {
                        companies.sort((a, b) => a.ticker.localeCompare(b.ticker)).sort().map((company) => (
                        <Option key={company.ticker} value={company.ticker}>
                            {company.ticker} - {company.name}
                        </Option>
                    ))}
                </Select>
            </div>

            <div className={'chartWrapper'}>
                <ResponsiveContainer width={1000} height={400}>
                    <LineChart data={formatChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" type="category" tick={{ fontSize: 12 }} tickLine={false} />
                        <YAxis tick={{ fontSize: 12 }} tickLine={false} label={{ value: 'Stock Value', angle: -90, position: 'outsideLeft', fontSize: 15 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="result" stroke="#8884d8" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}