import React, {useRef, useEffect, useState} from 'react';
import {useLocation} from "react-router-dom";
import axios from "axios";
import {Button, Col, Container, Row} from 'react-bootstrap';
import './Canvas.css'

function CanvasPage() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const imagePath = searchParams.get('image');
    const imageID = searchParams.get('id')
    let imageName: string
    if (imagePath) imageName = imagePath.substring(imagePath.lastIndexOf('/') + 1)
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasRefBG = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [canvasSize, setCanvasSize] = useState<{ width: number, height: number }>({width: 0, height: 0});
    const [rectangles, setRectangles] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
        name?: number
    }[]>([]);
    const [startPos, setStartPos] = useState<{ x: number; y: number }>({x: 0, y: 0});
    const [currentPos, setCurrentPos] = useState<{ x: number; y: number }>({x: 0, y: 0});
    const [inputPos, setInputPos] = useState<{ x: number; y: number } | null>(null);
    const [inputValue, setInputValue] = useState<string>('');
    const [currentRectangleIndex, setCurrentRectangleIndex] = useState<number | null>(null);
    const [canvasOffset, setCanvasOffset] = useState({x: 0, y: 0})
    const backgroundRef = useRef<HTMLImageElement>(null!);
    const [labelID, setLabelID] = useState(0)
    const [datasetClasses, setDatasetClasses] = useState<string[]>([])
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
    const intervalIdRef = useRef<NodeJS.Timeout>()
    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    async function checkTaskProgress(taskId: any) {
        try {
            axios.get(`http://127.0.0.1:8000/api/taskStatus`, {
                params: {
                    task_id: taskId
                }
            }).then(res => {
                const {state} = res.data;
                if (state === 'PENDING') console.log('pending')
                if (state === 'PROGRESS') {
                    console.log(`Working`);
                } else if (state === 'SUCCESS') {
                    console.log('Task completed');
                    clearInterval(intervalIdRef.current)
                    fetchData(axios.CancelToken.source())
                } else if (state === 'FAILURE') {
                    console.log('Task failed.')
                    clearInterval(intervalIdRef.current)
                }
            })
        } catch (error) {
            console.error('Error checking task progress:', error);
        }
    }

    function convertRectanglesToString(rectangles: any[]) {
        return rectangles.map(rect => {
            const x = (rect.x + rect.width / 2) / backgroundRef.current.width;
            const y = (rect.y + rect.height / 2) / backgroundRef.current.height;
            const w = rect.width / backgroundRef.current.width;
            const h = rect.height / backgroundRef.current.height;
            return `${rect.name} ${x.toFixed(6)} ${y.toFixed(6)} ${w.toFixed(6)} ${h.toFixed(6)}`;
        }).join('\n');

    }

    function saveData() {
        if (inputPos) return
        const updatedText = convertRectanglesToString(rectangles);
        axios.patch(`http://127.0.0.1:8000/api/labels/update-label/`,
            {file: updatedText, image_id: imageID}, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${localStorage.getItem('token')}`,
                }
            }).then(res => {
            console.log("Data saved successfully:", res.data);
        }).catch(err => {
            console.error("Error saving data:", err);
        });
    }

    function fetchData(source: { token: any; }) {
        setRectangles([])
        axios.get<{
            id: number,
            file: string,
            image: { dataset_classes: string[] }
        }[]>('http://127.0.0.1:8000/api/labels/', {
            params: {image_id: imageID},
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.getItem('token')}`,
            },
            cancelToken: source.token,
        }).then(res => {
            const url = res.data[0].file
            setLabelID(res.data[0].id)
            setDatasetClasses(res.data[0].image.dataset_classes)
            console.log(res.data)
            axios.get(url, {
                cancelToken: source.token,
                responseType: 'text',
                headers: {
                    'Cache-Control': "max-age=0, no-cache, no-store, must-revalidate",
                    'Pragma': "no-cache",
                    'Expires': "Wed, 11 Jan 1984 05:00:00 GMT",
                    'Content-Type': 'text/plain',
                    'Authorization': `Token ${localStorage.getItem('token')}`,
                }
            }).then(res => {
                const text = res.data
                if (text.trim() === '') {
                    console.log("Text is empty. No rectangles created.");
                    return;
                }
                const lines = text.trim().split('\n');
                console.log(lines)
                const newRectangles = lines.map((line: { split: (arg0: string) => [any, any, any, any, any]; }) => {
                    const [id, x, y, w, h] = line.split(' ');
                    return {
                        x: (parseFloat(x) * backgroundRef.current.width) - (parseFloat(w) * backgroundRef.current.width) / 2,
                        y: (parseFloat(y) * backgroundRef.current.height) - (parseFloat(h) * backgroundRef.current.height) / 2,
                        width: parseFloat(w) * backgroundRef.current.width,
                        height: parseFloat(h) * backgroundRef.current.height,
                        name: id,
                    }
                })
                setRectangles(oldArray => [...oldArray, ...newRectangles])
            }).catch(err => {
                console.log(err)
            })

        }).catch(err => {
            console.log(err)
        })
    }

    useEffect(() => {
        const source = axios.CancelToken.source();
        if (!backgroundRef.current) {
            backgroundRef.current = new Image();
            if (imagePath) {
                backgroundRef.current.src = imagePath;
                backgroundRef.current.onload = () => {
                    setCanvasSize({width: backgroundRef.current.width, height: backgroundRef.current.height});
                    let offsetX = 0
                    if (backgroundRef.current.width < window.innerWidth)
                        offsetX = (window.innerWidth - backgroundRef.current.width) / 2
                    let offsetY = 0
                    if (backgroundRef.current.height < window.innerHeight)
                        offsetY = (window.innerHeight - backgroundRef.current.height) / 2
                    setCanvasOffset({x: offsetX, y: offsetY})
                };
            }
        }
        fetchData(source)
        return function cleanup() {
            source.cancel()
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRefBG.current;
        if (!canvas || !imagePath) return;
        const ctx = canvas.getContext('2d');
        const background = backgroundRef.current;
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    }, [imagePath, canvasSize]);


    useEffect(() => {
        const draw = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            rectangles.forEach(rect => {
                ctx.beginPath();
                ctx.rect(rect.x, rect.y, rect.width, rect.height);
                ctx.stroke();
                if (rect.name !== undefined) {
                    ctx.font = '1em Verdana'
                    ctx.fillText(datasetClasses[rect.name], rect.x, rect.y - 5);
                }
            });

            if (isDrawing) {
                ctx.beginPath();
                ctx.rect(startPos.x, startPos.y, currentPos.x - startPos.x, currentPos.y - startPos.y);
                ctx.stroke();

            }

        };
        draw();
    }, [rectangles, isDrawing, startPos, currentPos])


    function rectangleIsClicked() {
        const x = currentPos.x
        const y = currentPos.y
        let collisionDetected = false
        const border=7
        for (let index = 0; index < rectangles.length; index++) {
            const rect = rectangles[index];
            const rectX = rect.x
            const rectY = rect.y
            const width = rect.width
            const height = rect.height
            const topBottom = (x >= rectX) && (x <= rectX + width) && ((y <= rectY + border && y >= rectY - border) || (y <= rectY + height + border && y >= rectY + height - border))
            const leftRight = (y > rectY) && (y < rectY + height) && ((x <= rectX + border && x >= rectX - border) || (x <= rectX + width + border && x >= rectX + width - border))
            collisionDetected = topBottom || leftRight
            if (collisionDetected)
                return index
        }
        return -1
    }

    const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (inputPos) return;
        const rectIndex = rectangleIsClicked()
        if (rectIndex >= 0) {
            const rect = rectangles[rectIndex];
            setCurrentRectangleIndex(rectIndex);
            setInputPos({x: rect.x, y: rect.y});
            if (rect.name !== undefined) setInputValue(datasetClasses[rect.name]);
            else setInputValue('')
            return;
        }
        setIsDrawing(true);
        setStartPos({x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY});
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (inputPos) return;
        if (!isDrawing) setStartPos({x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY});
        setCurrentPos({x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY});
    };

    const handleMouseUp = () => {
        if (inputPos) return;
        setIsDrawing(false);
        const width=(currentPos.x - startPos.x) > 0 ? currentPos.x - startPos.x : startPos.x - currentPos.x
        const height=(currentPos.y - startPos.y) > 0 ? currentPos.y - startPos.y : startPos.y - currentPos.y
        const minDim=2
        if(width<minDim||height<minDim) return;
        const newRectangle = {
            x: startPos.x < currentPos.x ? startPos.x : currentPos.x,
            y: startPos.y < currentPos.y ? startPos.y : currentPos.y,
            width: width,
            height: height
        };
        setRectangles([...rectangles, newRectangle]);
        setInputPos({x: currentPos.x, y: currentPos.y});
        setCurrentRectangleIndex(rectangles.length);
    };
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && inputValue.trim() !== '') {
            const index = datasetClasses.indexOf(inputValue.trim())
            if (index === -1) {
                console.log('not allowed')
                return
            }
            const updatedRectangles = [...rectangles];
            if (currentRectangleIndex !== null) {
                updatedRectangles[currentRectangleIndex] = {
                    ...updatedRectangles[currentRectangleIndex],
                    name: index
                };
                setRectangles(updatedRectangles);
                setInputPos(null);
                setInputValue('');
            }
        } else if (event.key === 'Escape') {
            setRectangles(prevRectangles => prevRectangles.filter((_, index) => index !== currentRectangleIndex))
            setInputPos(null);
            setInputValue('');
        }
    };

    function startLabeling() {
        console.log(labelID, datasetClasses)
        axios.post('http://127.0.0.1:8000/api/labelSingleImage', {
            image: imageID,
            label: labelID,
            datasetClasses: datasetClasses,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.getItem('token')}`,
            }
        }).then(res => {
            const id=res.data.task_id
            intervalIdRef.current = setInterval(() => checkTaskProgress(id), 1000);
        })
    }

    return (
        <Container fluid>
            <Row>
                <Col md={3} className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                    <div className="sidebar-content">
                        <Button onClick={startLabeling} className="sidebar-button">Automatic label</Button>
                        <Button onClick={saveData} className="sidebar-button">Save</Button>
                    </div>
                    <Button onClick={toggleSidebar} className="toggle-sidebar-button"/>
                </Col>
                <Col md={sidebarCollapsed ? 12 : 9}>
                    <canvas
                        style={{position: 'absolute', top: canvasOffset.y, left: canvasOffset.x,}}
                        ref={canvasRefBG}
                        width={canvasSize.width}
                        height={canvasSize.height}
                    />
                    <canvas
                        style={{position: 'absolute', top: canvasOffset.y, left: canvasOffset.x,}}
                        ref={canvasRef}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                    />
                    {inputPos && (
                        <input
                            type="text"
                            style={{
                                position: 'absolute',
                                left: inputPos.x + canvasOffset.x,
                                top: inputPos.y + canvasOffset.y,
                                zIndex: 10
                            }}
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleInputKeyDown}
                            autoFocus
                        />
                    )}
                </Col>
            </Row>
        </Container>
    );
}

export default CanvasPage;

